using System;
using Godot;
using Microsoft.ClearScript;

namespace Spectral.React
{
	public class BoxPropHelpers
	{

		public static void InjectProps(BoxContainer instance, ScriptObject prevProps, ScriptObject props)
		{
			if (C.TryGetProps(props, "alignment", out object alignment))
			{
				instance.Alignment = (BoxContainer.AlignmentMode)Convert.ToInt64(alignment);
			}
			C.InjectThemeIntProps(instance, props, "separation", "separation");
		}
	}
}
