using System;
using System.Collections.Generic;
using Godot;
using Microsoft.ClearScript;
using Microsoft.ClearScript.V8;

namespace Spectral.React
{
	public partial class Document : Node
	{
		public static Document Instance { get; private set; }

		readonly List<IDom> _children;
		V8ScriptEngine _engine;
		SetTimeout _timers;
		ReactBridge _bridge;

		[Export]
		bool LiveReload = false;

		ScriptObject _styleSheet = null;

		static Dictionary<string, Type> _customNodes = new();

		public Document()
		{
			_children = new List<IDom>();
		}

		public override void _Ready()
		{
			base._Ready();
			if (Instance != null && Instance != this)
			{
				GD.PrintErr("Multiple Spectral.React.Document instances detected; overwriting Document.Instance");
			}
			Instance = this;
			Setup();
		}

		public override void _ExitTree()
		{
			base._ExitTree();
			if (Instance == this)
			{
				Instance = null;
			}
			try
			{
				_timers?.Dispose();
			}
			catch (Exception ex)
			{
				GD.PrintErr(ex);
			}
			_timers = null;
			try
			{
				_engine?.Dispose();
			}
			catch (Exception ex)
			{
				GD.PrintErr(ex);
			}
			_engine = null;
			_bridge = null;
		}

		public ReactBridge Bridge => _bridge;

		public void clearChildren()
		{
			for (int i = _children.Count - 1; i >= 0; i--)
			{
				removeChild(_children[i]);
			}
		}

		public void appendChild(IDom node)
		{
			if (node == null)
				return;

			if (_children.Contains(node))
				_children.Remove(node);
			_children.Add(node);

			var gdNode = node.getNode();
			if (gdNode == null)
				return;

			var currentParent = gdNode.GetParent();
			if (currentParent != this)
			{
				currentParent?.RemoveChild(gdNode);
				AddChild(gdNode);
			}
			MoveChild(gdNode, _children.Count - 1);
		}

		public void insertBefore(IDom node, IDom beforeNode)
		{
			if (node == null)
				return;
			if (beforeNode == null)
			{
				appendChild(node);
				return;
			}

			var beforeIndex = _children.IndexOf(beforeNode);
			if (beforeIndex < 0)
			{
				appendChild(node);
				return;
			}

			var existingIndex = _children.IndexOf(node);
			if (existingIndex >= 0)
			{
				_children.RemoveAt(existingIndex);
				if (existingIndex < beforeIndex)
					beforeIndex--;
			}

			_children.Insert(beforeIndex, node);

			var gdNode = node.getNode();
			if (gdNode == null)
				return;

			var currentParent = gdNode.GetParent();
			if (currentParent != this)
			{
				currentParent?.RemoveChild(gdNode);
				AddChild(gdNode);
			}
			MoveChild(gdNode, beforeIndex);
		}

		public void removeChild(IDom node)
		{
			if (node == null)
				return;
			_children.Remove(node);
			var gdNode = node.getNode();
			if (gdNode != null)
			{
				RemoveChild(gdNode);
				gdNode.QueueFree();
			}
		}

		// CLASSES

		/// <summary>
		/// To be called from JS. This sets a stylesheet.
		/// </summary>
		/// <param name="obj"></param>
		public void setStyleSheet(ScriptObject obj)
		{
			_styleSheet = obj;
		}

		public ScriptObject getClassFromStyleSheet(string className)
		{
			if (_styleSheet == null)
			{
				return null;
			}
			_engine.Script.__stylesheet = _styleSheet;
			_engine.Script.__classname = className;
			object styles = _engine.Evaluate(
				@"
				__stylesheet[__classname];
			"
			);
			if (styles is ScriptObject stylesObj)
			{
				return stylesObj;
			}
			return null;
		}

		// INTEROP
		public void ExposeObjectToJS(string name, object objectToSend)
		{
			_engine.AddHostObject(name, objectToSend);
		}

		public void ExposeTypeToJS(string name, System.Type typeToSend)
		{
			_engine.AddHostType(name, typeToSend);
		}

		public V8ScriptEngine Engine()
		{
			return _engine;
		}

		// DEBUGGING
		public void PrintJSObj(object obj)
		{
			Engine().Script.__log = obj;
			Engine()
				.Evaluate(
					@"
						GD.Print(JSON.stringify(Object.keys(__log)))
					"
				);
		}

		// PRIVATE

		void Setup()
		{
			_engine = new V8ScriptEngine(
				V8ScriptEngineFlags.EnableDebugging | V8ScriptEngineFlags.EnableRemoteDebugging,
				9222
			);
			_timers = new SetTimeout(_engine, this);
			_bridge = new ReactBridge();

			_engine.AddHostType("GD", typeof(GD));
			_engine.AddHostType("Color", typeof(Color));
			_engine.AddHostType("Vector2", typeof(Vector2));
			_engine.AddHostType("Texture2D", typeof(Texture2D));
			_engine.AddHostType("Theme", typeof(Theme));
			_engine.AddHostType("Font", typeof(Font));
			_engine.AddHostType("StyleBox", typeof(StyleBox));

			_engine.AddHostType("Document", typeof(Document));
			_engine.AddHostObject("root", this);
			_engine.AddHostObject("bridge", _bridge);

			using var file = Godot.FileAccess.Open(
				"res://app/dist/index.js",
				Godot.FileAccess.ModeFlags.Read
			);
			_engine.Execute(file.GetAsText());

			if (LiveReload)
			{
				GDScript DirectoryWatcherScript = (GDScript)
					GD.Load("res://vendor/DirectoryWatcher.gd");
				Node DirectoryWatcher = (Node)DirectoryWatcherScript.New(); // This is a GodotObject
				DirectoryWatcher.Call("add_scan_directory", "res://app/dist");
				AddChild(DirectoryWatcher);
				DirectoryWatcher.Connect(
					"files_modified",
					Callable.From<Godot.Collections.Array>(OnLiveReload)
				);
				GD.Print("Watching!");
			}
		}

		protected void OnLiveReload(Godot.Collections.Array files)
		{
			GD.Print("Live reload!");
			clearChildren();
			using var file = Godot.FileAccess.Open(
				"res://app/dist/index.js",
				Godot.FileAccess.ModeFlags.Read
			);
			try
			{
				_engine.Execute(file.GetAsText());
			}
			catch (System.Exception e)
			{
				GD.Print("Failed to run livereload ", e);
			}
		}

		public static void AddCustomNode(string type, Type nodeType) { 
			if (_customNodes.ContainsKey(type)) {
				return;
			}
			_customNodes.Add(type, nodeType);
		}

		public static IAnimatedDom createElement(
			string type,
			ScriptObject props,
			Document rootContainer = null
		)
		{
			IAnimatedDom newNode;
			if (_customNodes.ContainsKey(type))
			{
				try
				{
					newNode = (IAnimatedDom)Activator.CreateInstance(_customNodes[type]);
					return newNode;
				}
				catch (Exception e)
				{
					GD.Print(e);
				}
			}
			switch (type.ToLower())
			{
				case "textedit":
					newNode = new TextEditNode();
					break;
				case "margin":
					newNode = new MarginNode();
					break;
				case "image":
					newNode = new SpriteNode();
					break;
				case "texture":
					newNode = new TextureNode();
					break;
				case "flow":
					newNode = new FlowNode();
					break;
				case "label":
					if (C.TryGetProps(props, "rich", out object isRich))
					{
						newNode = new RichLabelNode();
						break;
					}
					newNode = new LabelNode();
					break;
				case "button":
					newNode = new ButtonNode();
					break;

				// box containers
				case "hbox":
					newNode = new HBoxNode();
					break;
				case "vbox":
					newNode = new VBoxNode();
					break;
				case "control":
					newNode = new ControlNode();
					break;
				case "div":
					if (C.TryGetStyleProps(props, "backgroundStyle", out object hasBackground))
					{
						newNode = new PanelNode();
						break;
					}
					newNode = new ContainerNode();
					break;
				case "raw":
					if (C.TryGetProps(props, "type", out object rawType))
					{
						newNode = new RawNode((string)rawType);
						break;
					}
					newNode = new DomNode<Node>();
					break;
				default:
					newNode = new ContainerNode();
					break;
			}
			if (newNode != null && rootContainer != null)
			{
				newNode.setDocument(rootContainer);
				newNode.updateProps(props);
			}
			return newNode;
		}
	}
}
