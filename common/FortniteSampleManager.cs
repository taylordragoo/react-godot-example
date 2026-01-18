using System;
using Godot;
using Microsoft.ClearScript;
using ReactDocument = Spectral.React.Document;

namespace Spectral.Demo
{
	public partial class FortniteSampleManager : Node
	{
		[Export]
		public bool DemoMode = true;

		[Export]
		public float DemoMinWaitSeconds = 1f;

		[Export]
		public float DemoMaxWaitSeconds = 5f;

		[Export]
		public int DemoSlotCount = 6;

		[Export]
		public double Health = 100;

		[Export]
		public double MaxHealth = 100;

		[Export]
		public double Shield = 50;

		[Export]
		public double MaxShield = 100;

		[Export]
		public int Ammo = 50;

		[Export]
		public int SlotIndex = 0;

		[Export]
		public string StormTime = "0:36";

		[Export]
		public int PlayersLeft = 25;

		[Export]
		public int Eliminations = 7;

		bool _subscribed;
		bool _dirty = true;
		bool _demoCancelled;
		RandomNumberGenerator _rng;

		double _lastHealth;
		double _lastMaxHealth;
		double _lastShield;
		double _lastMaxShield;
		int _lastAmmo;
		int _lastSlotIndex;
		string _lastStormTime;
		int _lastPlayersLeft;
		int _lastEliminations;

		public override void _Ready()
		{
			base._Ready();
			SetProcess(true);
			_rng = new RandomNumberGenerator();
			_rng.Randomize();
			_demoCancelled = false;
			CallDeferred(nameof(InitializeBridge));
			if (DemoMode)
			{
				CallDeferred(nameof(StartDemoLoops));
			}
		}

		public override void _ExitTree()
		{
			base._ExitTree();
			_demoCancelled = true;

			try
			{
				var bridge = ReactDocument.Instance?.Bridge;
				if (bridge != null)
				{
					bridge.Dispatch -= OnDispatch;
				}
			}
			catch
			{
				// ignore
			}

			BridgeStateStore.Remove("fortnite");
			_subscribed = false;
		}

		public override void _Process(double delta)
		{
			base._Process(delta);
			EnsureBridgeSubscription();
			PublishStateIfChanged();
		}

		void InitializeBridge()
		{
			EnsureBridgeSubscription();
			PublishStateIfChanged();
		}

		void StartDemoLoops()
		{
			// Fire-and-forget loops; cancelled in _ExitTree.
			DemoHealthLoop();
			DemoShieldLoop();
			DemoSlotLoop();
		}

		async void DemoHealthLoop()
		{
			while (!_demoCancelled && IsInsideTree())
			{
				var tree = GetTree();
				if (tree == null)
					return;

				var wait = Mathf.Max(0.01f, _rng.RandfRange(DemoMinWaitSeconds, DemoMaxWaitSeconds));
				await ToSignal(tree.CreateTimer(wait), SceneTreeTimer.SignalName.Timeout);
				if (_demoCancelled || !IsInsideTree())
					return;

				var max = Math.Max(0.0, MaxHealth);
				var next = Health;

				// Roll a number different from current by at least 20% of max.
				var minDelta = max * 0.2;
				int tries = 0;
				while (tries++ < 20 && Math.Abs(next - Health) < minDelta)
				{
					next = _rng.RandfRange(0f, (float)max);
				}

				Health = Mathf.Clamp(next, 0.0, max);
				_dirty = true;
			}
		}

		async void DemoShieldLoop()
		{
			while (!_demoCancelled && IsInsideTree())
			{
				var tree = GetTree();
				if (tree == null)
					return;

				var wait = Mathf.Max(
					0.01f,
					_rng.RandfRange(DemoMinWaitSeconds, DemoMaxWaitSeconds) * 1.25f
				);
				await ToSignal(tree.CreateTimer(wait), SceneTreeTimer.SignalName.Timeout);
				if (_demoCancelled || !IsInsideTree())
					return;

				var max = Math.Max(0.0, MaxShield);
				Shield = Mathf.Clamp(_rng.RandfRange(0f, (float)max), 0.0, max);
				_dirty = true;
			}
		}

		async void DemoSlotLoop()
		{
			while (!_demoCancelled && IsInsideTree())
			{
				var tree = GetTree();
				if (tree == null)
					return;

				var wait = Mathf.Max(0.01f, _rng.RandfRange(DemoMinWaitSeconds, DemoMaxWaitSeconds));
				await ToSignal(tree.CreateTimer(wait), SceneTreeTimer.SignalName.Timeout);
				if (_demoCancelled || !IsInsideTree())
					return;

				var maxSlots = Math.Max(1, DemoSlotCount);
				var index = SlotIndex;
				int tries = 0;
				while (tries++ < 10 && index == SlotIndex)
				{
					index = _rng.RandiRange(0, maxSlots - 1);
				}

				SlotIndex = Mathf.Clamp(index, 0, maxSlots - 1);
				_dirty = true;
			}
		}

		void EnsureBridgeSubscription()
		{
			if (_subscribed)
				return;

			var bridge = ReactDocument.Instance?.Bridge;
			if (bridge == null)
				return;

			bridge.Dispatch += OnDispatch;
			_subscribed = true;
			_dirty = true;
		}

		void PublishStateIfChanged()
		{
			if (!_subscribed)
				return;

			if (
				!_dirty
				&& Health.Equals(_lastHealth)
				&& MaxHealth.Equals(_lastMaxHealth)
				&& Shield.Equals(_lastShield)
				&& MaxShield.Equals(_lastMaxShield)
				&& Ammo == _lastAmmo
				&& SlotIndex == _lastSlotIndex
				&& string.Equals(StormTime, _lastStormTime, StringComparison.Ordinal)
				&& PlayersLeft == _lastPlayersLeft
				&& Eliminations == _lastEliminations
			)
			{
				return;
			}

			_lastHealth = Health;
			_lastMaxHealth = MaxHealth;
			_lastShield = Shield;
			_lastMaxShield = MaxShield;
			_lastAmmo = Ammo;
			_lastSlotIndex = SlotIndex;
			_lastStormTime = StormTime;
			_lastPlayersLeft = PlayersLeft;
			_lastEliminations = Eliminations;
			_dirty = false;

			BridgeStateStore.Set(
				"fortnite",
				new
				{
					health = Health,
					maxHealth = MaxHealth,
					shield = Shield,
					maxShield = MaxShield,
					ammo = Ammo,
					slotIndex = SlotIndex,
					stormTime = StormTime,
					playersLeft = PlayersLeft,
					eliminations = Eliminations,
				}
			);
		}

		void OnDispatch(ScriptObject action)
		{
			if (action == null)
				return;

			if (!(action.GetProperty("type") is string type))
				return;

			var payload = action.GetProperty("payload") as ScriptObject;

			switch (type)
			{
				case "fortnite/slot_prev":
				{
					var maxSlots = Math.Max(1, DemoSlotCount);
					SlotIndex = (SlotIndex - 1 + maxSlots) % maxSlots;
					_dirty = true;
					break;
				}
				case "fortnite/slot_next":
				{
					var maxSlots = Math.Max(1, DemoSlotCount);
					SlotIndex = (SlotIndex + 1) % maxSlots;
					_dirty = true;
					break;
				}
				case "fortnite/set_slot_index":
				{
					if (payload == null)
						break;

					try
					{
						var index = Convert.ToInt32(payload.GetProperty("index"));
						var maxSlots = Math.Max(1, DemoSlotCount);
						SlotIndex = Mathf.Clamp(index, 0, maxSlots - 1);
						_dirty = true;
					}
					catch (Exception)
					{
						// ignore malformed payloads
					}
					break;
				}
				case "fortnite/set_health":
				{
					if (payload == null)
						break;

					try
					{
						var value = Convert.ToDouble(payload.GetProperty("value"));
						var max = Math.Max(0.0, MaxHealth);
						Health = Mathf.Clamp(value, 0.0, max);
						_dirty = true;
					}
					catch (Exception)
					{
						// ignore malformed payloads
					}
					break;
				}
				case "fortnite/set_shield":
				{
					if (payload == null)
						break;

					try
					{
						var value = Convert.ToDouble(payload.GetProperty("value"));
						var max = Math.Max(0.0, MaxShield);
						Shield = Mathf.Clamp(value, 0.0, max);
						_dirty = true;
					}
					catch (Exception)
					{
						// ignore malformed payloads
					}
					break;
				}
			}
		}
	}
}
