using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Text.Json;
using Microsoft.ClearScript;

namespace Spectral.React
{
    public sealed class ReactBridge
    {
        readonly ConcurrentQueue<string> _events = new();
        string _stateJson = "{}";
        int _version;

        static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        public int version => Volatile.Read(ref _version);

        public string getStateJson()
        {
            return Volatile.Read(ref _stateJson);
        }

        public void setStateJson(string json)
        {
            Volatile.Write(ref _stateJson, string.IsNullOrWhiteSpace(json) ? "{}" : json);
            Interlocked.Increment(ref _version);
        }

        public void setState(object state)
        {
            try
            {
                setStateJson(JsonSerializer.Serialize(state, JsonOptions));
            }
            catch (Exception)
            {
                setStateJson("{}");
            }
        }

        public void emit(string type, object payload = null)
        {
            if (string.IsNullOrWhiteSpace(type))
                type = "event";

            string payloadJson;
            try
            {
                payloadJson = JsonSerializer.Serialize(payload, JsonOptions);
            }
            catch (Exception)
            {
                payloadJson = JsonSerializer.Serialize(payload?.ToString(), JsonOptions);
            }

            var typeJson = JsonSerializer.Serialize(type, JsonOptions);
            _events.Enqueue($"{{\"type\":{typeJson},\"payload\":{payloadJson}}}");
            Interlocked.Increment(ref _version);
        }

        public string[] drainEvents()
        {
            if (_events.IsEmpty)
                return Array.Empty<string>();

            var events = new List<string>();
            while (_events.TryDequeue(out var ev))
            {
                events.Add(ev);
            }
            return events.ToArray();
        }

        public event Action<ScriptObject> Dispatch;

        public void dispatch(ScriptObject action)
        {
            Dispatch?.Invoke(action);
        }
    }
}
