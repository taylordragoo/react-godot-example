using System;
using Godot;
using Microsoft.ClearScript;

namespace Spectral.React
{
	public class UiRootNode : DomNode<UiRoot>
	{
		protected override void updatePropsImpl(ScriptObject newProps)
		{
			ControlPropHelpers.InjectProps(this, _instance, _previousProps, newProps);

			if (C.TryGetProps(newProps, "scale", out object scale))
			{
				try
				{
					_instance.UiScale = Convert.ToSingle(scale);
				}
				catch (Exception)
				{
					// ignore malformed scale values
				}
			}
		}
	}
}

