declare function setTimeout(
	handler: (...args: any[]) => void,
	timeout?: number,
	...args: any[]
): number
declare function clearTimeout(id: number): void

declare function setInterval(
	handler: (...args: any[]) => void,
	timeout?: number,
	...args: any[]
): number
declare function clearInterval(id: number): void

declare function setImmediate(handler: (...args: any[]) => void, ...args: any[]): number
declare function clearImmediate(id: number): void

declare function queueMicrotask(handler: () => void): void

declare function requestAnimationFrame(callback: (time: number) => void): number
declare function cancelAnimationFrame(handle: number): void

declare var performance: {
	now(): number
}

declare class MessagePort {
	onmessage: ((event: { data: any }) => void) | null
	postMessage(data: any): void
	close(): void
	start(): void
}

declare class MessageChannel {
	port1: MessagePort
	port2: MessagePort
}

declare interface ReactBridge {
	readonly version: number
	getStateJson(): string
	setStateJson(json: string): void
	setState(state: any): void
	emit(type: string, payload?: any): void
	drainEvents(): string[]
	dispatch(action: any): void
}

declare var bridge: ReactBridge

