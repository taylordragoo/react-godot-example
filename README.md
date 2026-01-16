# React GD

React.js integration with the Godot Game Engine by using [Microsoft's Clearscript](https://github.com/microsoft/ClearScript) to run JS code via [Google's v8](https://v8.dev/).

Runs on Godot 4.2.1's Mono build.

> This is not production-ready code! Nor is any support or maintenance going to be expected. Use at your own risk.

## Running the sample

There are both NuGet and NPM dependencies, so you'll need to install them after downloading the game project:

```bash
# in the project directory
$ dotnet restore
$ cd app
$ npm install
```

The React app lives in the `app` folder, while the binding code to make it work in Godot lives in the `react` folder -- **all** of the UI should go into the `app/src` folder as `.ts` files.

This project uses `esbuild` to build the JS app, which should've been installed when you installed dependencies. You can build the app as follows using:

```bash
# in the ./app directory
$ node build.js

# or use this to automatically rebuild on changes
$ node build.js -w
```

There are three different 'apps' in this sample, under `app/src/examples`. To switch between them, you have to change the import in `app/src/index.tsx` (currently `import { App } from "./examples/kitchen-sink"`) to point to the example you want to run, rebuild the JS app, and run the Godot project.

## How do I use this in my own project?

Uh. I'm not sure I recommend it??? But if you really want to:

1. Copy the `react` folder into the project directory of your Godot game. You'll need Godot 4.2 or up.
2. Install `Microsoft.ClearScript.Complete` in your project via dotnet.
3. Go into the `react` folder and run `node scripts/bootstrap-app.mjs` from there. This will create an `app` folder where your React code should live.
4. Run `npm install` inside of the `app` folder.
5. Add the `ReactRoot.tscn` scene to the root of your game. (Alternatively, since it is a fairly simple scene: Create a `CanvasLayer` node at the root of your game, and attach the `react/gd_nodes/Document.cs` script to it.)

Then it should work? Some limitations:

* You can only have one instance of React in your game, so if you want to switch UI views, you'll have to have a router from within your React app.
* Likewise, things might go bad if you at any point remove the node containing `Document.cs` from the node tree.
* This doesn't use the HTML DOM! So any React libraries that rely on the DOM cannot be used. State management libraries like Redux can, however, since they care only about the react core.

## How do you send game logic back and forth between JS and C#?

The short version: expose a small “bridge” object to JS, and treat it like an external store.

Ideally, there's a one-directional flow. JS calls methods from C#, but C# shouldn't have to call anything from JS.

The entry point and root node of the React app is a `Document`, which can be found at `react/gd_nodes/Document.cs`. The V8 engine is defined there, as are all the functions to create and update components.

### Bridge

`Document` now exposes a `bridge` host object to JavaScript (see `react/utils/ReactBridge.cs`). This is designed to solve two problems:

- **JS → C#**: send actions/commands from UI to game logic (`bridge.dispatch(...)`).
- **C# → JS/React**: publish game state to the UI as a JSON snapshot (`bridge.setState(...)` / `bridge.setStateJson(...)`).

The JS side polls `bridge.version` each frame (via `requestAnimationFrame`) and uses `useSyncExternalStore` so React re-renders when the snapshot changes.

JS helper functions live in `app/react_lib/bridge.ts` (and the template copy in `react/react_lib/_lib/bridge.ts`).

### Example: JS → C#

In JS:

```ts
import { dispatch } from "bridge"

dispatch({ type: "set_volume", payload: { value: 0.5 } })
```

In C# (anywhere in your game code):

```csharp
Spectral.React.Document.Instance.Bridge.Dispatch += action => {
    var type = action?.GetProperty("type") as string;
    GD.Print($"action: {type}");
};
```

### Example: C# → JS/React

In C#:

```csharp
Spectral.React.Document.Instance.Bridge.setState(new { health = 100, ammo = 30 });
```

In JS:

```ts
import { useBridgeState } from "bridge"

const health = useBridgeState((s) => s.health)
```

### Events?

For “ephemeral” events (toasts, sfx triggers, etc.), C# can call `bridge.emit(type, payload)` and JS can read them with `drainEvents()`. The payload is serialized as JSON, so keep it JSON-friendly.

## Other Libraries

There's some code in here that aren't related to React (that isn't an npm or nuget package), mostly for convenience as I was writing out this demo and seeing this project's viability. They're listed as follows:

* `common/WindowManagement.cs` - helper node to ensure the game window starts at the right size on high-DPI screens. I wrote this, and I copy and paste it into every game.
* `vendor/DirectoryWatcher.gd` - https://github.com/KoBeWi/Godot-Directory-Watcher - helper node written in GDScript (hooray, mixing GDScript and C#!) that is used to implement a 'live reload' function by watching when the react scripts change and reloading the Document node.
* `addons/godot-css-theme` - https://github.com/kuma-gee/godot-css-theme - used to turn CSS into Godot theme objects, which is just handy.
* `react/utils/SetTimeout.cs` - original version retrieved from https://github.com/microsoft/ClearScript/issues/475, with some modifications that I made to have it work. I barely understand it myself...
