using System;
using Godot;
using Microsoft.ClearScript;

namespace Spectral.React
{
    public class SliderNode : DomNode<HSlider>
    {
        Godot.Range.ValueChangedEventHandler changeEvent;
        bool _syncingFromProps;

        protected override void updatePropsImpl(ScriptObject newProps)
        {
            ControlPropHelpers.InjectProps(this, _instance, _previousProps, newProps);

            if (C.TryGetProps(newProps, "min", out object min))
            {
                _instance.MinValue = Convert.ToDouble(min);
            }
            if (C.TryGetProps(newProps, "max", out object max))
            {
                _instance.MaxValue = Convert.ToDouble(max);
            }
            if (C.TryGetProps(newProps, "step", out object step))
            {
                _instance.Step = Convert.ToDouble(step);
            }
            if (C.TryGetProps(newProps, "editable", out object editable))
            {
                _instance.Editable = (bool)editable;
            }

            if (C.TryGetProps(newProps, "value", out object value))
            {
                _syncingFromProps = true;
                _instance.Value = Convert.ToDouble(value);
                _syncingFromProps = false;
            }

            if (C.TryGetProps(newProps, "onChange", out dynamic onChange))
            {
                if (changeEvent != null)
                {
                    _instance.ValueChanged -= changeEvent;
                }
                changeEvent = (double v) =>
                {
                    if (_syncingFromProps)
                        return;
                    onChange(v);
                };
                _instance.ValueChanged += changeEvent;
            }
            else if (changeEvent != null)
            {
                _instance.ValueChanged -= changeEvent;
                changeEvent = null;
            }
        }
    }
}
