using System;
using Godot;
using Microsoft.ClearScript;

namespace Spectral.React
{
    public class ControlPropHelpers
    {
        public static void InjectProps(
            IAnimatedDom component,
            Control instance,
            ScriptObject prevProps,
            ScriptObject props
        )
        {
            C.InjectBaseProps(component, instance, prevProps, props);

            if (
                C.TryGetProps(props, "tooltip", out object tooltipProps)
                && tooltipProps is string tooltip
            )
            {
                instance.TooltipText = tooltip;
            }

            if (C.TryGetProps(props, "theme", out object theme))
            {
                try
                {
                    if (theme is Theme themeObj)
                    {
                        instance.Theme = (Theme)themeObj;
                    }
                    else
                    {
                        instance.Theme = GD.Load<Theme>((string)theme);
                    }
                }
                catch (Exception e)
                {
                    GD.Print(e);
                }
            }

            // INPUT / MOUSE ACTIONS
            var handlerStore = component as IEventHandlerStore;

            if (
                handlerStore != null
                && handlerStore.TryGetEventHandler("onMouseEnter", out var prevMouseEnterHandler)
                && prevMouseEnterHandler is Action prevMouseEnterAction
            )
            {
                instance.MouseEntered -= prevMouseEnterAction;
                handlerStore.RemoveEventHandler("onMouseEnter");
            }
            if (C.TryGetProps(props, "onMouseEnter", out object mouseEnterProps))
            {
                Action handler = () => ((dynamic)mouseEnterProps)();
                instance.MouseEntered += handler;
                handlerStore?.SetEventHandler("onMouseEnter", handler);
            }

            if (
                handlerStore != null
                && handlerStore.TryGetEventHandler("onMouseExit", out var prevMouseExitHandler)
                && prevMouseExitHandler is Action prevMouseExitAction
            )
            {
                instance.MouseExited -= prevMouseExitAction;
                handlerStore.RemoveEventHandler("onMouseExit");
            }
            if (C.TryGetProps(props, "onMouseExit", out object mouseExitProps))
            {
                Action handler = () => ((dynamic)mouseExitProps)();
                instance.MouseExited += handler;
                handlerStore?.SetEventHandler("onMouseExit", handler);
            }

            if (
                handlerStore != null
                && handlerStore.TryGetEventHandler("onGuiInput", out var prevGuiInputHandler)
                && prevGuiInputHandler is Control.GuiInputEventHandler prevGuiInputAction
            )
            {
                instance.GuiInput -= prevGuiInputAction;
                handlerStore.RemoveEventHandler("onGuiInput");
            }
            if (C.TryGetProps(props, "onGuiInput", out object guiInputProps))
            {
                Control.GuiInputEventHandler handler = ev => ((dynamic)guiInputProps)(ev);
                instance.GuiInput += handler;
                handlerStore?.SetEventHandler("onGuiInput", handler);
            }

            if (
                handlerStore != null
                && handlerStore.TryGetEventHandler("onClick", out var prevClickHandler)
                && prevClickHandler is Control.GuiInputEventHandler prevClickAction
            )
            {
                instance.GuiInput -= prevClickAction;
                handlerStore.RemoveEventHandler("onClick");
            }
            if (instance is not BaseButton && C.TryGetProps(props, "onClick", out object clickProps))
            {
                Control.GuiInputEventHandler handler = ev =>
                {
                    if (ev is not InputEventMouseButton mb)
                        return;
                    if (mb.ButtonIndex != MouseButton.Left)
                        return;
                    if (mb.Pressed)
                        return;

                    try
                    {
                        ((dynamic)clickProps)();
                    }
                    catch (Exception ex)
                    {
                        GD.PrintErr(ex);
                    }
                };

                instance.GuiInput += handler;
                handlerStore?.SetEventHandler("onClick", handler);
            }

            // STYLE ACTIONS
            if (!C.TryGetProps(props, "style", out object style))
            {
                return;
            }

            if (C.TryGetStyleProps(props, "autoTranslate", out object autoTranslate))
            {
                instance.AutoTranslate = (bool)autoTranslate;
            }

            if (C.TryGetStyleProps(props, "anchorPreset", out object anchorPreset))
            {
                instance.SetAnchorsPreset((Control.LayoutPreset)Convert.ToInt64(anchorPreset));
            }

            if (C.TryGetStyleProps(props, "clipContents", out object clipContents))
            {
                instance.ClipContents = Convert.ToBoolean(clipContents);
            }

            if (C.TryGetStyleProps(props, "focusMode", out object focusMode))
            {
                instance.FocusMode = (Control.FocusModeEnum)Convert.ToInt64(focusMode);
            }

            if (C.TryGetStyleProps(props, "expandBehaviorH", out object sizeFlagsH))
            {
                instance.SizeFlagsHorizontal = (Control.SizeFlags)Convert.ToInt64(sizeFlagsH);
            }
            if (C.TryGetStyleProps(props, "expandBehaviorV", out object sizeFlagsV))
            {
                instance.SizeFlagsVertical = (Control.SizeFlags)Convert.ToInt64(sizeFlagsV);
            }

            // mouse options
            if (C.TryGetStyleProps(props, "mouseDefaultCursorShape", out object mouseCursorShape))
            {
                instance.MouseDefaultCursorShape = (Control.CursorShape)
                    Convert.ToInt64(mouseCursorShape);
            }
            if (C.TryGetStyleProps(props, "mouseFilter", out object mouseFilter))
            {
                instance.MouseFilter = (Control.MouseFilterEnum)Convert.ToInt64(mouseFilter);
            }
            if (
                C.TryGetStyleProps(
                    props,
                    "mouseForcePassScrollEvents",
                    out object mouseForcePassScrollEvents
                )
            )
            {
                instance.MouseForcePassScrollEvents = (bool)mouseForcePassScrollEvents;
            }

            // absolute position
            bool hasGlobalPosition = false;
            if (C.TryGetStyleProps(props, "x", out object x))
            {
                hasGlobalPosition = true;
            }
            if (C.TryGetStyleProps(props, "y", out object y))
            {
                hasGlobalPosition = true;
            }
            if (hasGlobalPosition)
            {
                SyncGlobalPosition(component, instance, props);
            }

            if (C.TryGetStyleProps(props, "minWidth", out object minWidth))
            {
                T.SetOrPerformTransition(
                    component,
                    props,
                    T.GetPropertyNameForAnimatableNode(AnimatableNode.MinWidth),
                    Convert.ToInt32(minWidth)
                );
            }
            if (C.TryGetStyleProps(props, "minHeight", out object minHeight))
            {
                T.SetOrPerformTransition(
                    component,
                    props,
                    T.GetPropertyNameForAnimatableNode(AnimatableNode.MinHeight),
                    Convert.ToInt32(minHeight)
                );
            }

            // size
            if (C.TryGetStyleProps(props, "width", out object width))
            {
                T.SetOrPerformTransition(
                    component,
                    props,
                    T.GetPropertyNameForAnimatableNode(AnimatableNode.Width),
                    Convert.ToInt32(width)
                );
            }
            if (C.TryGetStyleProps(props, "height", out object height))
            {
                T.SetOrPerformTransition(
                    component,
                    props,
                    T.GetPropertyNameForAnimatableNode(AnimatableNode.Height),
                    Convert.ToInt32(height)
                );
            }

            // scale
            if (C.TryGetStyleProps(props, "scaleX", out object scaleX))
            {
                T.SetOrPerformTransition(
                    component,
                    props,
                    T.GetPropertyNameForAnimatableNode(AnimatableNode.ScaleX),
                    Convert.ToSingle(scaleX)
                );
            }

            if (C.TryGetStyleProps(props, "scaleY", out object scaleY))
            {
                T.SetOrPerformTransition(
                    component,
                    props,
                    T.GetPropertyNameForAnimatableNode(AnimatableNode.ScaleY),
                    Convert.ToSingle(scaleY)
                );
            }

            // grow direction
            if (C.TryGetStyleProps(props, "growHorizontal", out object growHorizontal))
            {
                instance.GrowHorizontal = (Control.GrowDirection)Convert.ToInt64(growHorizontal);
            }
            if (C.TryGetStyleProps(props, "growVertical", out object growVertical))
            {
                instance.GrowVertical = (Control.GrowDirection)Convert.ToInt64(growVertical);
            }

            if (C.TryGetStyleProps(props, "layoutDirection", out object layoutDirection))
            {
                instance.LayoutDirection = (Control.LayoutDirectionEnum)
                    Convert.ToInt64(layoutDirection);
            }
            
            InjectPositioningProps(instance, props);
            InjectAnchorProps(instance, prevProps, props);
        }

        static void InjectPositioningProps(Control instance, ScriptObject props)
        {
            var hasTop = C.TryGetStyleProps(props, "top", out object top);
            var hasRight = C.TryGetStyleProps(props, "right", out object right);
            var hasBottom = C.TryGetStyleProps(props, "bottom", out object bottom);
            var hasLeft = C.TryGetStyleProps(props, "left", out object left);

            if (!hasTop && !hasRight && !hasBottom && !hasLeft)
            {
                return;
            }

            float? width = null;
            if (C.TryGetStyleProps(props, "width", out object widthObj))
            {
                width = Convert.ToSingle(widthObj);
            }
            else if (C.TryGetStyleProps(props, "minWidth", out object minWidthObj))
            {
                width = Convert.ToSingle(minWidthObj);
            }

            float? height = null;
            if (C.TryGetStyleProps(props, "height", out object heightObj))
            {
                height = Convert.ToSingle(heightObj);
            }
            else if (C.TryGetStyleProps(props, "minHeight", out object minHeightObj))
            {
                height = Convert.ToSingle(minHeightObj);
            }

            if (hasLeft && hasRight)
            {
                instance.SetAnchor(Side.Left, 0);
                instance.SetAnchor(Side.Right, 1);
                instance.OffsetLeft = Convert.ToSingle(left);
                instance.OffsetRight = -Convert.ToSingle(right);
            }
            else if (hasLeft)
            {
                var l = Convert.ToSingle(left);
                instance.SetAnchor(Side.Left, 0);
                instance.SetAnchor(Side.Right, 0);
                instance.OffsetLeft = l;
                instance.OffsetRight = l + (width ?? 0);
            }
            else if (hasRight)
            {
                var r = Convert.ToSingle(right);
                instance.SetAnchor(Side.Left, 1);
                instance.SetAnchor(Side.Right, 1);
                instance.OffsetRight = -r;
                instance.OffsetLeft = -r - (width ?? 0);
            }

            if (hasTop && hasBottom)
            {
                instance.SetAnchor(Side.Top, 0);
                instance.SetAnchor(Side.Bottom, 1);
                instance.OffsetTop = Convert.ToSingle(top);
                instance.OffsetBottom = -Convert.ToSingle(bottom);
            }
            else if (hasTop)
            {
                var t = Convert.ToSingle(top);
                instance.SetAnchor(Side.Top, 0);
                instance.SetAnchor(Side.Bottom, 0);
                instance.OffsetTop = t;
                instance.OffsetBottom = t + (height ?? 0);
            }
            else if (hasBottom)
            {
                var b = Convert.ToSingle(bottom);
                instance.SetAnchor(Side.Top, 1);
                instance.SetAnchor(Side.Bottom, 1);
                instance.OffsetBottom = -b;
                instance.OffsetTop = -b - (height ?? 0);
            }
        }

        protected static void InjectAnchorProps(
            Control instance,
            ScriptObject prevProps,
            ScriptObject props)
        {
            if (C.TryGetStyleProps(props, "anchorBottom", out object anchorBottom))
            {
                // instance.AnchorBottom = Convert.ToSingle(anchorBottom);
                instance.SetAnchor(Side.Bottom, Convert.ToSingle(anchorBottom));
            }
            if (C.TryGetStyleProps(props, "anchorLeft", out object anchorLeft))
            {
                // instance.AnchorLeft = Convert.ToSingle(anchorLeft);
                instance.SetAnchor(Side.Left, Convert.ToSingle(anchorLeft));
            }
            if (C.TryGetStyleProps(props, "anchorTop", out object anchorTop))
            {
                // instance.AnchorTop = Convert.ToSingle(anchorTop);
                instance.SetAnchor(Side.Top, Convert.ToSingle(anchorTop));
            }
            if (C.TryGetStyleProps(props, "anchorRight", out object anchorRight))
            {
                // instance.AnchorRight = Convert.ToSingle(anchorRight);
                instance.SetAnchor(Side.Right, Convert.ToSingle(anchorRight));
            }
            
            // offset
            if (C.TryGetStyleProps(props, "offsetBottom", out object offsetBottom))
            {
                instance.OffsetBottom = Convert.ToSingle(offsetBottom);
            }
            if (C.TryGetStyleProps(props, "offsetLeft", out object offsetLeft))
            {
                instance.OffsetLeft = Convert.ToSingle(offsetLeft);
            }
            if (C.TryGetStyleProps(props, "offsetTop", out object offsetTop))
            {
                instance.OffsetTop = Convert.ToSingle(offsetTop);
            }
            if (C.TryGetStyleProps(props, "offsetRight", out object offsetRight))
            {
                instance.OffsetRight = Convert.ToSingle(offsetRight);
            }
        }
        private static async void SyncGlobalPosition(
            IAnimatedDom component,
            Control instance,
            ScriptObject props
        )
        {
            if (!instance.IsInsideTree())
            {
                var tree = component.getDocument().GetTree();
                if (tree == null)
                {
                    return;
                }
                await component.getDocument().ToSignal(tree, SceneTree.SignalName.ProcessFrame);
                if (!instance.IsInsideTree())
                {
                    return;
                }
            }
            // absolute position
            if (C.TryGetStyleProps(props, "x", out object x))
            {
                T.SetOrPerformTransition(
                    component,
                    props,
                    "global_position:x",
                    Convert.ToSingle(x)
                );
            }
            if (C.TryGetStyleProps(props, "y", out object y))
            {
                T.SetOrPerformTransition(
                    component,
                    props,
                    "global_position:y",
                    Convert.ToSingle(y)
                );
            }
        }
    }
}
