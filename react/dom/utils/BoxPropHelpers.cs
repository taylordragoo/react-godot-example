using Godot;
using Microsoft.ClearScript;

namespace Spectral.React
{
	public class BoxPropHelpers
	{

		public static void InjectProps(
			IAnimatedDom component,
			BoxContainer instance,
			ScriptObject prevProps,
			ScriptObject props
		)
		{
			// Main-axis alignment / justification.
			if (C.TryGetProps(props, "alignment", out object alignment))
			{
				instance.Alignment = (BoxContainer.AlignmentMode)System.Convert.ToInt64(alignment);
			}
			else if (C.TryGetStyleProps(props, "justifyContent", out object justifyContentObj))
			{
				var justify = System.Convert.ToString(justifyContentObj);
				if (justify == "start")
				{
					instance.Alignment = BoxContainer.AlignmentMode.Begin;
				}
				else if (justify == "center")
				{
					instance.Alignment = BoxContainer.AlignmentMode.Center;
				}
				else if (justify == "end")
				{
					instance.Alignment = BoxContainer.AlignmentMode.End;
				}
				else if (justify == "between")
				{
					instance.Alignment = BoxContainer.AlignmentMode.Begin;
				}
			}

			// Base gap from Tailwind-ish `gap-*`.
			int baseGap = 0;
			if (C.TryGetStyleProps(props, "separation", out object separationObj))
			{
				try
				{
					baseGap = System.Math.Max(0, (int)System.Convert.ToInt64(separationObj));
				}
				catch
				{
					baseGap = 0;
				}
			}

			C.InjectThemeIntProps(instance, props, "separation", "separation");

			var wantsBetween =
				C.TryGetStyleProps(props, "justifyContent", out object jcObj)
				&& System.Convert.ToString(jcObj) == "between";

			var hasAlignItems = C.TryGetStyleProps(props, "alignItems", out object aiObj);
			var alignItems = hasAlignItems ? System.Convert.ToString(aiObj) : null;

			var handlerStore = component as IEventHandlerStore;

			// Remove previous handlers when not needed.
			if (handlerStore != null && !wantsBetween && !hasAlignItems)
			{
				DetachLayoutHandlers(handlerStore, instance);
				if (!C.TryGetStyleProps(props, "separation", out _))
				{
					instance.RemoveThemeConstantOverride("separation");
				}
				return;
			}

			if (handlerStore != null)
			{
				DetachLayoutHandlers(handlerStore, instance);
			}

			System.Action updateLayout = () =>
			{
				ApplyAlignItems(instance, alignItems);
				if (wantsBetween)
				{
					ApplyJustifyBetween(instance, baseGap);
				}
			};

			// Hook up to size + child changes so we stay correct as React mutates children.
			System.Action resizedHandler = () => updateLayout();
			instance.Resized += resizedHandler;

			Node.ChildEnteredTreeEventHandler childEnteredHandler = _ => updateLayout();
			instance.ChildEnteredTree += childEnteredHandler;

			Node.ChildExitingTreeEventHandler childExitingHandler = _ => updateLayout();
			instance.ChildExitingTree += childExitingHandler;

			handlerStore?.SetEventHandler("tw:layout:resized", resizedHandler);
			handlerStore?.SetEventHandler("tw:layout:childEntered", childEnteredHandler);
			handlerStore?.SetEventHandler("tw:layout:childExiting", childExitingHandler);

			updateLayout();
		}

		static void DetachLayoutHandlers(IEventHandlerStore store, BoxContainer instance)
		{
			if (
				store.TryGetEventHandler("tw:layout:resized", out var prevResized)
				&& prevResized is System.Action prevResizedAction
			)
			{
				instance.Resized -= prevResizedAction;
				store.RemoveEventHandler("tw:layout:resized");
			}

			if (
				store.TryGetEventHandler("tw:layout:childEntered", out var prevChildEntered)
				&& prevChildEntered is Node.ChildEnteredTreeEventHandler prevChildEnteredHandler
			)
			{
				instance.ChildEnteredTree -= prevChildEnteredHandler;
				store.RemoveEventHandler("tw:layout:childEntered");
			}

			if (
				store.TryGetEventHandler("tw:layout:childExiting", out var prevChildExiting)
				&& prevChildExiting is Node.ChildExitingTreeEventHandler prevChildExitingHandler
			)
			{
				instance.ChildExitingTree -= prevChildExitingHandler;
				store.RemoveEventHandler("tw:layout:childExiting");
			}
		}

		static void ApplyAlignItems(BoxContainer instance, string alignItems)
		{
			if (string.IsNullOrWhiteSpace(alignItems))
			{
				return;
			}

			var isRow = instance is HBoxContainer;
			Control.SizeFlags flag;
			if (alignItems == "start")
			{
				flag = Control.SizeFlags.ShrinkBegin;
			}
			else if (alignItems == "center")
			{
				flag = Control.SizeFlags.ShrinkCenter;
			}
			else if (alignItems == "end")
			{
				flag = Control.SizeFlags.ShrinkEnd;
			}
			else if (alignItems == "stretch")
			{
				flag = Control.SizeFlags.Fill;
			}
			else
			{
				return;
			}

			foreach (var child in instance.GetChildren())
			{
				if (child is not Control control)
					continue;
				if (isRow)
				{
					control.SizeFlagsVertical = flag;
				}
				else
				{
					control.SizeFlagsHorizontal = flag;
				}
			}
		}

		static void ApplyJustifyBetween(BoxContainer instance, int baseGap)
		{
			var isRow = instance is HBoxContainer;

			float containerSize = isRow ? instance.Size.X : instance.Size.Y;
			if (containerSize <= 0)
				return;

			float totalChildSize = 0;
			int count = 0;

			foreach (var child in instance.GetChildren())
			{
				if (child is not Control control)
					continue;
				if (!control.Visible)
					continue;

				var min = control.GetCombinedMinimumSize();
				totalChildSize += isRow ? min.X : min.Y;
				count++;
			}

			if (count <= 1)
			{
				instance.AddThemeConstantOverride("separation", baseGap);
				return;
			}

			var remaining = containerSize - totalChildSize - (baseGap * (count - 1));
			if (remaining < 0)
				remaining = 0;

			var computed = baseGap + (remaining / (count - 1));
			instance.AddThemeConstantOverride("separation", (int)Mathf.Round(computed));
		}
	}
}
