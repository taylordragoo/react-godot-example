using Godot;

namespace Spectral.React
{
	/// <summary>
	/// A UI scaling root that keeps Control anchoring correct by expanding its logical size
	/// to the viewport size divided by the scale, then applying a matching CanvasItem scale.
	/// </summary>
	public partial class UiRoot : Control
	{
		[Export]
		public float UiScale { get; set; } = 1f;

		Vector2 _lastViewportSize = Vector2.Zero;
		float _lastScale = -1f;

		public override void _Ready()
		{
			base._Ready();
			SetProcess(true);
			UpdateLayout();
		}

		public override void _Process(double delta)
		{
			base._Process(delta);
			UpdateLayout();
		}

		void UpdateLayout()
		{
			var viewport = GetViewport();
			if (viewport == null)
				return;

			var viewportSize = viewport.GetVisibleRect().Size;
			var scale = Mathf.Max(0.0001f, UiScale);

			if (viewportSize == _lastViewportSize && Mathf.IsEqualApprox(scale, _lastScale))
				return;

			_lastViewportSize = viewportSize;
			_lastScale = scale;

			AnchorLeft = 0;
			AnchorTop = 0;
			AnchorRight = 0;
			AnchorBottom = 0;

			Position = Vector2.Zero;
			Size = viewportSize / scale;
			Scale = new Vector2(scale, scale);
		}
	}
}

