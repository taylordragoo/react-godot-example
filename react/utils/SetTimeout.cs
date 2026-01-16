using System;
using Godot;
using Microsoft.ClearScript.V8;

namespace Spectral.React
{
    /// <summary>
    /// A helper class that implements setTimeout/setInterval for ClearScript V8
    /// by scheduling callbacks on the Godot main thread (via SceneTreeTimer).
    /// All timers are managed through a JS-side queue; C# only schedules the next wake-up.
    ///
    /// This keeps V8 calls on the main thread (important for thread-safety) while still supporting
    /// many timers efficiently (only one active SceneTreeTimer at a time).
    /// </summary>
    // code inspired from https://github.com/microsoft/ClearScript/issues/475
    public sealed class TimerImpl : IDisposable
    {
        readonly Node _owner;
        Func<double> _callback = () => -1;
        SceneTreeTimer _timer;
        bool _disposed;

        public TimerImpl(Node owner)
        {
            _owner = owner ?? throw new ArgumentNullException(nameof(owner));
        }

        public void Initialize(dynamic callback) => _callback = () => (double)callback();

        public void Schedule(double delay)
        {
            if (_disposed)
                return;

            CancelTimer();

            if (delay < 0)
                return;

            var tree = _owner.GetTree();
            if (tree == null)
                return;

            _timer = tree.CreateTimer(Mathf.Max(0.0f, (float)(delay / 1000.0)));
            _timer.Timeout += RunCallback;
        }

        void RunCallback()
        {
            if (_disposed)
                return;

            CancelTimer();

            try
            {
                var nextDelay = _callback();
                Schedule(nextDelay);
            }
            catch (Exception ex)
            {
                GD.PrintErr(ex);
            }
        }

        void CancelTimer()
        {
            if (_timer == null)
                return;
            _timer.Timeout -= RunCallback;
            _timer = null;
        }

        public void Dispose()
        {
            _disposed = true;
            CancelTimer();
        }
    }

    public sealed class AnimationFrameImpl : IDisposable
    {
        readonly Node _owner;
        Func<bool> _callback = () => false;
        Callable _processFrameCallable;
        bool _connected;
        bool _disposed;

        public AnimationFrameImpl(Node owner)
        {
            _owner = owner ?? throw new ArgumentNullException(nameof(owner));
        }

        public void Initialize(dynamic callback)
        {
            _callback = () => (bool)callback();
        }

        public void RequestTick()
        {
            if (_disposed || _connected)
                return;

            var tree = _owner.GetTree();
            if (tree == null)
                return;

            _processFrameCallable = Callable.From(OnProcessFrame);
            tree.Connect(SceneTree.SignalName.ProcessFrame, _processFrameCallable);
            _connected = true;
        }

        void OnProcessFrame()
        {
            if (_disposed)
                return;

            bool keepRunning = false;
            try
            {
                keepRunning = _callback();
            }
            catch (Exception ex)
            {
                GD.PrintErr(ex);
                keepRunning = false;
            }

            if (!keepRunning)
            {
                Disconnect();
            }
        }

        void Disconnect()
        {
            if (!_connected)
                return;

            var tree = _owner.GetTree();
            if (tree != null)
            {
                try
                {
                    if (tree.IsConnected(SceneTree.SignalName.ProcessFrame, _processFrameCallable))
                    {
                        tree.Disconnect(SceneTree.SignalName.ProcessFrame, _processFrameCallable);
                    }
                }
                catch (Exception ex)
                {
                    GD.PrintErr(ex);
                }
            }

            _connected = false;
            _processFrameCallable = default;
        }

        public void Dispose()
        {
            _disposed = true;
            Disconnect();
        }
    }

    public sealed class SetTimeout : IDisposable
    {
        readonly TimerImpl _timerImpl;
        readonly AnimationFrameImpl _animationFrameImpl;
        bool _disposed;

        public SetTimeout(V8ScriptEngine engine, Node owner)
        {
            if (engine == null)
                throw new ArgumentNullException(nameof(engine));
            if (owner == null)
                throw new ArgumentNullException(nameof(owner));

            _timerImpl = new TimerImpl(owner);
            dynamic setupTimers = engine.Evaluate(
                @"(impl => {
    let queue = [], nextId = 0;
    const maxId = 1000000000000, getNextId = () => nextId = (nextId % maxId) + 1;
    const add = entry => {
        const index = queue.findIndex(element => element.due > entry.due);
        index >= 0 ? queue.splice(index, 0, entry) : queue.push(entry);
    }
    function set(periodic, func, delay) {
        delay = +delay || 0;
        if (delay < 0) delay = 0;
        const id = getNextId(), now = Date.now(), args = [...arguments].slice(3);
        add({ id, periodic, func: func, args, delay, due: now + delay });
        impl.Schedule(queue[0].due - now);
        return id;
    };
    function clear(id) {
        queue = queue.filter(entry => entry.id != id);
        impl.Schedule(queue.length > 0 ? queue[0].due - Date.now() : -1);
    };
    globalThis.setTimeout = set.bind(undefined, false);
    globalThis.setInterval = set.bind(undefined, true);
    globalThis.clearTimeout = globalThis.clearInterval = clear.bind(undefined);
    impl.Initialize(() => {
        const now = Date.now();
        while ((queue.length > 0) && (now >= queue[0].due)) {
            const entry = queue.shift();
            if (entry.periodic) add({ ...entry, due: now + entry.delay });
            try {
                entry.func(...entry.args);
            } catch (err) {
                try {
                    if (typeof GD !== 'undefined' && GD.PrintErr) GD.PrintErr(err);
                    else if (typeof console !== 'undefined' && console.error) console.error(err);
                } catch (_e) {}
            }
        }
        return queue.length > 0 ? queue[0].due - now : -1;
    });
})"
            );
            setupTimers(_timerImpl);

            engine.Execute(
                @"
            (() => {
                // setImmediate / clearImmediate
                if (typeof globalThis.setImmediate !== 'function') {
                    globalThis.setImmediate = (func, ...args) => setTimeout(func, 0, ...args);
                }
                if (typeof globalThis.clearImmediate !== 'function') {
                    globalThis.clearImmediate = (id) => clearTimeout(id);
                }

                // queueMicrotask
                if (typeof globalThis.queueMicrotask !== 'function') {
                    globalThis.queueMicrotask = (cb) => Promise.resolve().then(cb);
                }

                // performance.now
                if (typeof globalThis.performance !== 'object' || globalThis.performance === null) {
                    globalThis.performance = {};
                }
                if (typeof globalThis.performance.now !== 'function') {
                    const start = Date.now();
                    globalThis.performance.now = () => Date.now() - start;
                }

                // MessageChannel (minimal polyfill for React's scheduler/act)
                if (typeof globalThis.MessageChannel === 'undefined') {
                    function MessagePort() {
                        this.onmessage = null;
                        this._other = null;
                        this._closed = false;
                    }
                    MessagePort.prototype.postMessage = function (data) {
                        if (this._closed) return;
                        const other = this._other;
                        if (!other || other._closed) return;
                        const handler = other.onmessage;
                        if (typeof handler !== 'function') return;
                        setImmediate(() => handler({ data }));
                    };
                    MessagePort.prototype.close = function () {
                        this._closed = true;
                        this.onmessage = null;
                        this._other = null;
                    };
                    MessagePort.prototype.start = function () { };
                    globalThis.MessageChannel = function () {
                        this.port1 = new MessagePort();
                        this.port2 = new MessagePort();
                        this.port1._other = this.port2;
                        this.port2._other = this.port1;
                    };
                }
            })();
        "
            );

            _animationFrameImpl = new AnimationFrameImpl(owner);
            dynamic setupRaf = engine.Evaluate(
                @"(impl => {
    let queue = [], nextId = 0;
    const maxId = 1000000000000, getNextId = () => nextId = (nextId % maxId) + 1;

    function request(cb) {
        const id = getNextId();
        queue.push({ id, cb });
        impl.RequestTick();
        return id;
    }

    function cancel(id) {
        queue = queue.filter(entry => entry.id != id);
    }

    globalThis.requestAnimationFrame = request;
    globalThis.cancelAnimationFrame = cancel;

    impl.Initialize(() => {
        if (queue.length === 0) return false;

        const current = queue;
        queue = [];

        const ts = (typeof performance === 'object' && performance && typeof performance.now === 'function')
            ? performance.now()
            : Date.now();

        for (let i = 0; i < current.length; i++) {
            const entry = current[i];
            try {
                entry.cb(ts);
            } catch (err) {
                try {
                    if (typeof GD !== 'undefined' && GD.PrintErr) GD.PrintErr(err);
                    else if (typeof console !== 'undefined' && console.error) console.error(err);
                } catch (_e) { }
            }
        }

        // If callbacks queued more frames, keep the pump running.
        return queue.length > 0;
    });
})"
            );
            setupRaf(_animationFrameImpl);
        }

        public void Dispose()
        {
            if (_disposed)
                return;
            _disposed = true;
            _animationFrameImpl.Dispose();
            _timerImpl.Dispose();
        }
    }
}
