import Reconciler from "react-reconciler"
import { DefaultEventPriority } from "react-reconciler/constants"
import type { ComponentProps } from "react"

const shallowCompare = (obj1, obj2) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every(key => obj1[key] === obj2[key]);

const isAllTextChildren = (children: unknown) => {
	if (typeof children === "string" || typeof children === "number") return true
	if (Array.isArray(children) && children.length > 0) {
		return children.every((c) => typeof c === "string" || typeof c === "number")
	}
	return false
}

const CustomReconciler = Reconciler<
	string, // type for creating components
	Record<string, any>, // props
	Document, // root document type
	IDom, // base node type
	IDom, // text instance type
	any,
	any,
	any, // component instance
	any, // host context
	Record<string, any>, // prepare and commit update changes
	any,
	number, // handle for proxy timeout...but I don't use it here.
	any
>({
	appendInitialChild(parentInstance: IDom, child: IDom) {
		if (child !== null) {
			parentInstance.appendChild(child)
		}
	},
	createInstance(type: string, props: ComponentProps<any>, rootContainer?: Document) {
		// we can create any object here that represents the node.
		// in react-dom, this is where we'd create the dom element!
		// in Godot, we might want to instead create the node in C#, and figure out how to get it back here
		// (maybe with a binding file in TS?)
		// @ts-ignore
		let element = Document.createElement(type, props, rootContainer)
		return element
	},
	clearContainer(container: Document) {
		container.clearChildren()
	},
	appendChild(parentInstance: IDom, child: IDom) {
		parentInstance.appendChild(child)
	},
	appendChildToContainer(container: Document, child: IDom) {
		container.appendChild(child)
	},
	removeChild(parentInstance: IDom, child: IDom) {
		parentInstance.removeChild(child)
	},
	removeChildFromContainer(container: Document, child: IDom) {
		container.removeChild(child)
	},
	insertBefore(parentInstance: IDom, child: IDom, beforeChild: IDom) {
		parentInstance.insertBefore(child, beforeChild)
	},
	insertInContainerBefore(container: Document, child: IDom, beforeChild: IDom) {
		container.insertBefore(child, beforeChild)
	},
	createTextInstance(text: string, rootContainerInstance: Document, internalInstanceHandle) {
		// @ts-ignore
		return Document.createElement("label", { children: text }, rootContainerInstance)
	},
	finalizeInitialChildren(instance, type, props, rootContainer, hostContext) {
		return false
	},
	getPublicInstance(inst) {
		return inst
	},
	prepareForCommit(containerInfo: Document): Record<string, any> | null {
		return null
	},
	prepareUpdate(
		instance: IDom,
		type: string,
		oldProps: Record<string, any>,
		newProps: Record<string, any>
	): Record<string, any> {
		if (oldProps === newProps) {
			return {}
		}

		if (!oldProps) {
			return newProps
		}

		// diff the two to make sure that we don't send over too many props
		const diffedProps = {}
		for (let key of Object.keys(newProps)) {
			if (newProps[key] === oldProps[key]) {
				continue;
			}
			if (newProps[key].constructor == Object) {
				const newObj = newProps[key]
				const prevObj = oldProps[key]

				if (shallowCompare(newObj, prevObj)) {
					continue;
				}
			}
			
			diffedProps[key] = newProps[key]
		}

		return diffedProps
	},
	resetAfterCommit(containerInfo: Document): void {
		// noop
	},
	resetTextContent(wordElement: IDom): void {
		// noop
	},
	getRootHostContext(rootInstance: Document) {
		// You can use this 'rootInstance' to pass data from the roots.
		return null
	},
	getChildHostContext(parentHostContext) {
		return parentHostContext
	},
	shouldSetTextContent(type, props): boolean {
		// Return true to prevent React from creating a TextInstance child.
		// Only do this for host types that render their own text (e.g. Button, Label).
		const t = String(type).toLowerCase()
		if (t !== "button" && t !== "label") return false
		return isAllTextChildren(props?.children)
	},
	commitUpdate(instance, updatePayload, type, prevProps, nextProps, internalHandle) {
		// updatePayload is the return from prepareUpdate
		instance.updateProps(updatePayload)
	},
	commitTextUpdate(textInstance, oldText, newText) {
		textInstance.updateProps({ children: newText })
	},
	supportsMutation: true,
	supportsPersistence: false,
	preparePortalMount: function (_containerInfo: unknown): void {},
	scheduleTimeout: function (
		fn: (...args: unknown[]) => unknown,
		delay?: number | undefined
	): number {
		return setTimeout(fn, delay ?? 0) as unknown as number
	},
	cancelTimeout: function (id: number): void {
		clearTimeout(id)
	},
	supportsMicrotasks: true,
	scheduleMicrotask: function (fn: () => unknown): void {
		queueMicrotask(fn)
	},
	noTimeout: -1,
	isPrimaryRenderer: true,
	getCurrentEventPriority: function (): number {
		return DefaultEventPriority
	},
	getInstanceFromNode: function (node: any): Reconciler.Fiber | null | undefined {
		return null
	},
	beforeActiveInstanceBlur: function (): void {},
	afterActiveInstanceBlur: function (): void {},
	prepareScopeUpdate: function (_scopeInstance: any, _instance: any): void {},
	getInstanceFromScope: function (scopeInstance: any): IDom | null {
		return null
	},
	detachDeletedInstance: function (_node: IDom): void {},
	supportsHydration: false,
})

export const render = (element: any, container: Document = root) => {
	// I have no idea what any of the arguments besides the first one do
	const node = CustomReconciler.createContainer(
		container,
		0,
		null,
		true,
		false,
		"",
		(error) => {},
		null
	)
	CustomReconciler.updateContainer(element, node)
}
