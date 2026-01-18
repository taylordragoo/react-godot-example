using Godot;
using Microsoft.ClearScript;

namespace Spectral.React {
    public class MarginNode : DomNode<MarginContainer> {
		public MarginNode() : base() {
            _instance.SizeFlagsHorizontal = Control.SizeFlags.ExpandFill;
			_instance.SizeFlagsVertical = Control.SizeFlags.ExpandFill;
        }
        protected override void updatePropsImpl(ScriptObject newProps) {
            ControlPropHelpers.InjectProps(this, _instance, _previousProps, newProps);

			// Tailwind-ish: treat padding props as MarginContainer "margins".
			C.InjectThemeIntProps(_instance, newProps, "padding", "margin_top");
			C.InjectThemeIntProps(_instance, newProps, "padding", "margin_left");
			C.InjectThemeIntProps(_instance, newProps, "padding", "margin_right");
			C.InjectThemeIntProps(_instance, newProps, "padding", "margin_bottom");
			C.InjectThemeIntProps(_instance, newProps, "paddingTop", "margin_top");
			C.InjectThemeIntProps(_instance, newProps, "paddingLeft", "margin_left");
			C.InjectThemeIntProps(_instance, newProps, "paddingRight", "margin_right");
			C.InjectThemeIntProps(_instance, newProps, "paddingBottom", "margin_bottom");

			// Back-compat with old token mapping.
			C.InjectThemeIntProps(_instance, newProps, "margin", "margin_top");
			C.InjectThemeIntProps(_instance, newProps, "margin", "margin_left");
			C.InjectThemeIntProps(_instance, newProps, "margin", "margin_right");
			C.InjectThemeIntProps(_instance, newProps, "margin", "margin_bottom");
			C.InjectThemeIntProps(_instance, newProps, "marginTop", "margin_top");
			C.InjectThemeIntProps(_instance, newProps, "marginLeft", "margin_left");
			C.InjectThemeIntProps(_instance, newProps, "marginRight", "margin_right");
			C.InjectThemeIntProps(_instance, newProps, "marginBottom", "margin_bottom");
        }
    }
}
