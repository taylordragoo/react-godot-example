using Godot;
using Microsoft.ClearScript;

namespace Spectral.React {
    public class PanelNode : DomNode<PanelContainer> {
		StyleBoxFlat _tailwindStyleBox;
		bool _tailwindStyleBoxActive;

		public PanelNode() : base() {
            _instance.SizeFlagsHorizontal = Control.SizeFlags.ExpandFill;
			_instance.SizeFlagsVertical = Control.SizeFlags.ExpandFill;
        }
        protected override void updatePropsImpl(ScriptObject newProps) {
            ControlPropHelpers.InjectProps(this, _instance, _previousProps, newProps);

			// Back-compat: allow explicitly passing a stylebox resource (or path).
			if (C.TryGetStyleProps(newProps, "backgroundStyle", out _))
			{
				C.InjectThemeStyleboxProps(_instance, newProps, "backgroundStyle", "panel");
				_tailwindStyleBoxActive = false;
				return;
			}

			var isClassUpdate =
				C.TryGetProps(newProps, "__classUpdate", out object classUpdateObj)
				&& classUpdateObj is bool classUpdate
				&& classUpdate;

			var hasBgColor = C.TryGetStyleProps(newProps, "bgColor", out object bgColor);
			var hasBorderWidth = C.TryGetStyleProps(newProps, "borderWidth", out object borderWidth);
			var hasBorderColor = C.TryGetStyleProps(newProps, "borderColor", out object borderColor);
			var hasCornerRadius = C.TryGetStyleProps(newProps, "cornerRadius", out object cornerRadius);

			var hasPadding = C.TryGetStyleProps(newProps, "padding", out object padding);
			var hasPaddingX = C.TryGetStyleProps(newProps, "paddingX", out object paddingX);
			var hasPaddingY = C.TryGetStyleProps(newProps, "paddingY", out object paddingY);
			var hasPaddingLeft = C.TryGetStyleProps(newProps, "paddingLeft", out object paddingLeft);
			var hasPaddingRight = C.TryGetStyleProps(newProps, "paddingRight", out object paddingRight);
			var hasPaddingTop = C.TryGetStyleProps(newProps, "paddingTop", out object paddingTop);
			var hasPaddingBottom = C.TryGetStyleProps(newProps, "paddingBottom", out object paddingBottom);

			var hasAnyStyleBoxProps =
				hasBgColor
				|| hasBorderWidth
				|| hasBorderColor
				|| hasCornerRadius
				|| hasPadding
				|| hasPaddingX
				|| hasPaddingY
				|| hasPaddingLeft
				|| hasPaddingRight
				|| hasPaddingTop
				|| hasPaddingBottom;

			if (!isClassUpdate && !hasAnyStyleBoxProps)
			{
				// Avoid clobbering class-applied styleboxes when only inline style changes.
				return;
			}

			if (isClassUpdate && !hasAnyStyleBoxProps)
			{
				if (_tailwindStyleBoxActive)
				{
					_instance.RemoveThemeStyleboxOverride("panel");
					_tailwindStyleBoxActive = false;
				}
				return;
			}

			_tailwindStyleBox ??= new StyleBoxFlat();

			if (isClassUpdate)
			{
				_tailwindStyleBox.BgColor = new Color(0, 0, 0, 0);
				_tailwindStyleBox.BorderColor = new Color(0, 0, 0, 0);

				_tailwindStyleBox.BorderWidthLeft = 0;
				_tailwindStyleBox.BorderWidthTop = 0;
				_tailwindStyleBox.BorderWidthRight = 0;
				_tailwindStyleBox.BorderWidthBottom = 0;

				_tailwindStyleBox.CornerRadiusTopLeft = 0;
				_tailwindStyleBox.CornerRadiusTopRight = 0;
				_tailwindStyleBox.CornerRadiusBottomLeft = 0;
				_tailwindStyleBox.CornerRadiusBottomRight = 0;

				_tailwindStyleBox.ContentMarginLeft = 0;
				_tailwindStyleBox.ContentMarginTop = 0;
				_tailwindStyleBox.ContentMarginRight = 0;
				_tailwindStyleBox.ContentMarginBottom = 0;
			}

			if (hasBgColor)
			{
				_tailwindStyleBox.BgColor = C.ToColor(bgColor);
			}

			if (hasBorderColor)
			{
				_tailwindStyleBox.BorderColor = C.ToColor(borderColor);
			}

			if (hasBorderWidth)
			{
				var w = Mathf.Max(0, (int)System.Convert.ToInt64(borderWidth));
				_tailwindStyleBox.BorderWidthLeft = w;
				_tailwindStyleBox.BorderWidthTop = w;
				_tailwindStyleBox.BorderWidthRight = w;
				_tailwindStyleBox.BorderWidthBottom = w;
			}

			if (hasCornerRadius)
			{
				var r = Mathf.Max(0, (int)System.Convert.ToInt64(cornerRadius));
				_tailwindStyleBox.CornerRadiusTopLeft = r;
				_tailwindStyleBox.CornerRadiusTopRight = r;
				_tailwindStyleBox.CornerRadiusBottomLeft = r;
				_tailwindStyleBox.CornerRadiusBottomRight = r;
			}

			if (hasPadding)
			{
				var p = Mathf.Max(0, System.Convert.ToSingle(padding));
				_tailwindStyleBox.ContentMarginLeft = p;
				_tailwindStyleBox.ContentMarginTop = p;
				_tailwindStyleBox.ContentMarginRight = p;
				_tailwindStyleBox.ContentMarginBottom = p;
			}

			if (hasPaddingX)
			{
				var p = Mathf.Max(0, System.Convert.ToSingle(paddingX));
				_tailwindStyleBox.ContentMarginLeft = p;
				_tailwindStyleBox.ContentMarginRight = p;
			}

			if (hasPaddingY)
			{
				var p = Mathf.Max(0, System.Convert.ToSingle(paddingY));
				_tailwindStyleBox.ContentMarginTop = p;
				_tailwindStyleBox.ContentMarginBottom = p;
			}

			if (hasPaddingLeft)
			{
				_tailwindStyleBox.ContentMarginLeft = Mathf.Max(
					0,
					System.Convert.ToSingle(paddingLeft)
				);
			}

			if (hasPaddingRight)
			{
				_tailwindStyleBox.ContentMarginRight = Mathf.Max(
					0,
					System.Convert.ToSingle(paddingRight)
				);
			}

			if (hasPaddingTop)
			{
				_tailwindStyleBox.ContentMarginTop = Mathf.Max(0, System.Convert.ToSingle(paddingTop));
			}

			if (hasPaddingBottom)
			{
				_tailwindStyleBox.ContentMarginBottom = Mathf.Max(
					0,
					System.Convert.ToSingle(paddingBottom)
				);
			}

			_instance.AddThemeStyleboxOverride("panel", _tailwindStyleBox);
			_tailwindStyleBoxActive = true;
        }
    }
}
