using System;
using System.Collections.Generic;
using Godot;
using ReactDocument = Spectral.React.Document;

namespace Spectral.Demo
{
	/// <summary>
	/// Very small helper to keep a single bridge snapshot for multiple systems.
	/// Each caller updates a "slice" and we publish the merged object.
	/// </summary>
	public static class BridgeStateStore
	{
		static readonly Dictionary<string, object> State = new();

		public static void Set(string key, object value)
		{
			if (string.IsNullOrWhiteSpace(key))
				return;

			State[key] = value;
			Publish();
		}

		public static void Remove(string key)
		{
			if (string.IsNullOrWhiteSpace(key))
				return;

			if (State.Remove(key))
			{
				Publish();
			}
		}

		public static void Publish()
		{
			var bridge = ReactDocument.Instance?.Bridge;
			if (bridge == null)
				return;

			try
			{
				bridge.setState(new Dictionary<string, object>(State));
			}
			catch (Exception ex)
			{
				GD.PrintErr(ex);
			}
		}
	}
}

