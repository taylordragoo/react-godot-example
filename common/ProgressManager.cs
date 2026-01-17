using System;
using System.Collections.Generic;
using Godot;
using Microsoft.ClearScript;
using ReactDocument = Spectral.React.Document;

namespace Spectral.Demo
{
	public partial class ProgressManager : Node2D
	{
		[Export]
		public int SpawnBallCount = 10;

		[Export]
		public string BallTexturePath = "res://assets/fish_icon.png";

		[Export]
		public float BallSpeed = 180f;

		[Export]
		public float BallRadius = 16f;

		readonly List<Sprite2D> _balls = new();
		readonly List<Vector2> _velocities = new();
		double[] _positionsBuffer = Array.Empty<double>();

		bool _subscribed;
		double _progress;

		public int BallCount => _balls.Count;
		public double Progress => _progress;

		public override void _EnterTree()
		{
			base._EnterTree();
			AddToGroup("react_exposed");
		}

		public override void _Ready()
		{
			base._Ready();
			SpawnBalls();
		}

		public override void _Process(double delta)
		{
			base._Process(delta);
			EnsureBridgeSubscription();
			UpdateBalls(delta);
		}

		public void SetProgress(double value)
		{
			_progress = Mathf.Clamp(value, 0.0, 1.0);
			PublishState();
		}

		public void ResetProgress()
		{
			SetProgress(0);
		}

		public double[] GetBallPositions()
		{
			if (_positionsBuffer.Length != BallCount * 2)
			{
				_positionsBuffer = new double[BallCount * 2];
			}

			for (int i = 0; i < BallCount; i++)
			{
				var pos = _balls[i].GlobalPosition;
				_positionsBuffer[i * 2] = pos.X;
				_positionsBuffer[i * 2 + 1] = pos.Y;
			}
			return _positionsBuffer;
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
			PublishState();
		}

		void PublishState()
		{
			BridgeStateStore.Set("progress", _progress);
		}

		void OnDispatch(ScriptObject action)
		{
			if (action == null)
				return;

			if (!(action.GetProperty("type") is string type))
				return;

			switch (type)
			{
				case "set_progress":
				{
					var payload = action.GetProperty("payload") as ScriptObject;
					if (payload == null)
						return;

					var valueObj = payload.GetProperty("value");
					try
					{
						SetProgress(Convert.ToDouble(valueObj));
					}
					catch (Exception)
					{
						// ignore malformed payloads
					}
					break;
				}
				case "reset_progress":
					ResetProgress();
					break;
			}
		}

		void SpawnBalls()
		{
			var tex = !string.IsNullOrWhiteSpace(BallTexturePath)
				? GD.Load<Texture2D>(BallTexturePath)
				: null;

			var viewportRect = GetViewportRect();
			var rng = new RandomNumberGenerator();
			rng.Randomize();

			for (int i = 0; i < Mathf.Max(0, SpawnBallCount); i++)
			{
				var sprite = new Sprite2D();
				sprite.Texture = tex;
				sprite.Centered = true;

				sprite.GlobalPosition = new Vector2(
					rng.RandfRange(BallRadius, viewportRect.Size.X - BallRadius),
					rng.RandfRange(BallRadius, viewportRect.Size.Y - BallRadius)
				);

				AddChild(sprite);
				_balls.Add(sprite);

				var vel = new Vector2(rng.RandfRange(-1f, 1f), rng.RandfRange(-1f, 1f));
				if (vel.LengthSquared() < 0.001f)
				{
					vel = new Vector2(1, 0);
				}
				_velocities.Add(vel.Normalized() * BallSpeed);
			}
		}

		void UpdateBalls(double delta)
		{
			if (BallCount == 0)
				return;

			var viewportRect = GetViewportRect();
			var size = viewportRect.Size;

			for (int i = 0; i < BallCount; i++)
			{
				var pos = _balls[i].GlobalPosition;
				var vel = _velocities[i];

				pos += vel * (float)delta;

				if (pos.X <= BallRadius)
				{
					pos.X = BallRadius;
					vel.X = Math.Abs(vel.X);
				}
				else if (pos.X >= size.X - BallRadius)
				{
					pos.X = size.X - BallRadius;
					vel.X = -Math.Abs(vel.X);
				}

				if (pos.Y <= BallRadius)
				{
					pos.Y = BallRadius;
					vel.Y = Math.Abs(vel.Y);
				}
				else if (pos.Y >= size.Y - BallRadius)
				{
					pos.Y = size.Y - BallRadius;
					vel.Y = -Math.Abs(vel.Y);
				}

				_balls[i].GlobalPosition = pos;
				_velocities[i] = vel;
			}
		}
	}
}
