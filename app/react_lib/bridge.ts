import { useSyncExternalStore } from "react"

type Listener = () => void

const getBridge = () => (globalThis as any).bridge as ReactBridge

const listeners = new Set<Listener>()
let rafId: number | null = null
let lastVersion = -1

const tick = () => {
	rafId = requestAnimationFrame(tick)

	const version = getBridge().version
	if (version === lastVersion) return
	lastVersion = version

	for (const listener of listeners) listener()
}

export const subscribe = (listener: Listener) => {
	listeners.add(listener)

	if (rafId === null) {
		lastVersion = getBridge().version
		rafId = requestAnimationFrame(tick)
	}

	return () => {
		listeners.delete(listener)
		if (listeners.size === 0 && rafId !== null) {
			cancelAnimationFrame(rafId)
			rafId = null
		}
	}
}

let cachedStateVersion = -1
let cachedState: unknown = {}

export const getSnapshot = (): unknown => {
	const bridge = getBridge()
	const version = bridge.version
	if (version === cachedStateVersion) return cachedState

	cachedStateVersion = version
	try {
		const json = bridge.getStateJson()
		cachedState = json ? JSON.parse(json) : null
	} catch {
		cachedState = {}
	}
	return cachedState
}

export const useBridgeState = <T = unknown>(selector?: (state: any) => T): T => {
	const state = useSyncExternalStore(subscribe, getSnapshot) as any
	return selector ? selector(state) : state
}

export const dispatch = (action: { type: string; payload?: any }) => {
	getBridge().dispatch(action as any)
}

export const drainEvents = (): Array<{ type: string; payload: any }> => {
	const events = getBridge().drainEvents() as unknown as string[]
	const parsed: Array<{ type: string; payload: any }> = []
	for (const json of events) {
		try {
			parsed.push(JSON.parse(json))
		} catch {
			// ignore malformed events
		}
	}
	return parsed
}

