import { useEffect, useSyncExternalStore } from "react"

type Listener = () => void
export type BridgeEvent = { type: string; payload: any }
type EventListener = (event: BridgeEvent) => void

const getBridge = () => (globalThis as any).bridge as ReactBridge

const listeners = new Set<Listener>()
const eventListeners = new Set<EventListener>()
let rafId: number | null = null
let lastVersion = -1

const tick = () => {
	rafId = requestAnimationFrame(tick)

	const version = getBridge().version
	if (version === lastVersion) return
	lastVersion = version

	if (eventListeners.size) {
		for (const ev of drainEvents()) {
			for (const listener of eventListeners) listener(ev)
		}
	}

	for (const listener of listeners) listener()
}

const ensureTicking = () => {
	if (rafId !== null) return
	lastVersion = getBridge().version
	rafId = requestAnimationFrame(tick)
}

const maybeStopTicking = () => {
	if (listeners.size > 0) return
	if (eventListeners.size > 0) return
	if (rafId === null) return
	cancelAnimationFrame(rafId)
	rafId = null
}

export const subscribe = (listener: Listener) => {
	listeners.add(listener)
	ensureTicking()

	return () => {
		listeners.delete(listener)
		maybeStopTicking()
	}
}

export const subscribeEvents = (listener: EventListener) => {
	eventListeners.add(listener)
	ensureTicking()

	return () => {
		eventListeners.delete(listener)
		maybeStopTicking()
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

export const drainEvents = (): BridgeEvent[] => {
	const events = getBridge().drainEvents() as unknown as string[]
	const parsed: BridgeEvent[] = []
	for (const json of events) {
		try {
			parsed.push(JSON.parse(json))
		} catch {
			// ignore malformed events
		}
	}
	return parsed
}

export const useBridgeEvents = (handler: EventListener) => {
	useEffect(() => subscribeEvents(handler), [handler])
}
