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

    public class SetTimeout
    {
        public SetTimeout(V8ScriptEngine engine, Node owner)
        {
            dynamic setup = engine.Evaluate(
                @"(impl => {
    let queue = [], nextId = 0;
    const maxId = 1000000000000, getNextId = () => nextId = (nextId % maxId) + 1;
    const add = entry => {
        const index = queue.findIndex(element => element.due > entry.due);
        index >= 0 ? queue.splice(index, 0, entry) : queue.push(entry);
    }
    function set(periodic, func, delay) {
        delay = +delay || 0;
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
    globalThis.clearTimeout = globalThis.clearInterval = clear.bind();
    impl.Initialize(() => {
        const now = Date.now();
        while ((queue.length > 0) && (now >= queue[0].due)) {
            const entry = queue.shift();
            if (entry.periodic) add({ ...entry, due: now + entry.delay });
            entry.func(...entry.args);
        }
        return queue.length > 0 ? queue[0].due - now : -1;
    });
})"
            );
            setup(new TimerImpl(owner));

            // HACK: setImmediate as a 'do this now' function
            engine.Execute(
                @"
            globalThis.setImmediate = (func) => {
                setTimeout(func, 1)
            }
        "
            );
        }
    }
}
