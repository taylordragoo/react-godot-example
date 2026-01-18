import React, { useEffect, useMemo, useRef } from "react"
import {
	AlignmentMode,
	GrowDirection,
	LayoutPreset,
	MouseFilterEnum,
	SizeFlags,
	StretchModeEnum,
} from "gd"
import { useBridgeState } from "bridge"

const MAP_TEX = GD.Load<Texture2D>("res://assets/@fortnite-sample/map.jpg")

const createFlatStyleBox = (bgColor: string) => {
	const StyleBoxFlatCtor = (globalThis as any).StyleBoxFlat
	if (!StyleBoxFlatCtor) return null

	const sb = new StyleBoxFlatCtor()
	sb.BgColor = new Color(bgColor)
	return sb
}

const easeInOutQuad = (t: number) =>
	t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

export const Minimap = () => {
	const mapRef = useRef<IDom>()
	const hourGlassRef = useRef<IDom>()

	const { stormTime, playersLeft, eliminations } = useBridgeState((s: any) => {
		const fortnite = s?.fortnite
		return {
			stormTime: typeof fortnite?.stormTime === "string" ? fortnite.stormTime : "",
			playersLeft: typeof fortnite?.playersLeft === "number" ? fortnite.playersLeft : 0,
			eliminations:
				typeof fortnite?.eliminations === "number" ? fortnite.eliminations : 0,
		}
	})

	const styles = useMemo(() => {
		const panel = createFlatStyleBox("#D8CBB0FF")

		const bubble = createFlatStyleBox("#0000004D")
		if (bubble) {
			const r = 13
			bubble.CornerRadiusTopLeft = r
			bubble.CornerRadiusTopRight = r
			bubble.CornerRadiusBottomLeft = r
			bubble.CornerRadiusBottomRight = r
		}

		return { panel, bubble }
	}, [])

	useEffect(() => {
		const mapSize = 1400
		const baseLeft = -850
		const baseTop = -850
		const travel = 600
		const durationMs = 10000

		let startTs = -1
		let rafId = 0

		const tick = (ts: number) => {
			if (!mapRef.current) {
				rafId = requestAnimationFrame(tick)
				return
			}

			if (startTs < 0) startTs = ts

			const elapsed = ts - startTs
			const cycle = (elapsed / durationMs) % 2
			const pingPong = cycle < 1 ? cycle : 2 - cycle
			const eased = easeInOutQuad(pingPong)

			const dx = Math.round(eased * travel)
			const dy = Math.round(eased * travel)

			const left = baseLeft + dx
			const top = baseTop + dy

			mapRef.current.updateProps({
				style: {
					offsetLeft: left,
					offsetTop: top,
					offsetRight: left + mapSize,
					offsetBottom: top + mapSize,
				},
			})

			rafId = requestAnimationFrame(tick)
		}

		rafId = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(rafId)
	}, [])

	useEffect(() => {
		let isWhite = true

		const pulse = () => {
			hourGlassRef.current?.updateProps({
				style: { fontColor: isWhite ? "#FFFFFFFF" : "#FF0000FF" },
			})
			isWhite = !isWhite
		}

		pulse()
		const id = setInterval(pulse, 1000)
		return () => clearInterval(id)
	}, [])

	const iconAlign = { horizontalAlignment: 1, verticalAlignment: 1 }

	return (
		<vbox
			style={{
				anchorLeft: 1,
				anchorRight: 1,
				anchorTop: 0,
				anchorBottom: 0,
				offsetRight: -16,
				offsetLeft: -16 - 300,
				offsetTop: 16,
				offsetBottom: 16 + 400,
				growHorizontal: GrowDirection.Begin,
				growVertical: GrowDirection.End,
				separation: 8,
				zIndex: 30,
			}}
		>
			<div
				style={{
					backgroundStyle: styles.panel ?? "res://assets/panel.tres",
					clipContents: true,
					minWidth: 300,
					minHeight: 300,
					expandBehaviorH: SizeFlags.Fill,
					expandBehaviorV: SizeFlags.ShrinkBegin,
				}}
			>
				<control
					style={{
						anchorPreset: LayoutPreset.FullRect,
						mouseFilter: MouseFilterEnum.Ignore,
					}}
				>
					<texture
						ref={mapRef}
						texture={MAP_TEX}
						style={{
							anchorLeft: 0,
							anchorRight: 0,
							anchorTop: 0,
							anchorBottom: 0,
							offsetLeft: -850,
							offsetTop: -850,
							offsetRight: -850 + 1400,
							offsetBottom: -850 + 1400,
							stretchMode: StretchModeEnum.KeepAspectCovered,
							mouseFilter: MouseFilterEnum.Ignore,
						}}
					/>

					<label
						class="rpgawesome text-white text-xl"
						style={{
							anchorLeft: 0,
							anchorRight: 0,
							anchorTop: 0,
							anchorBottom: 0,
							offsetLeft: 140,
							offsetTop: 140,
							offsetRight: 140 + 40,
							offsetBottom: 140 + 40,
							...iconAlign,
							mouseFilter: MouseFilterEnum.Ignore,
							zIndex: 10,
						}}
					>
						{"\uEAC5"}
					</label>
				</control>
			</div>

			<hbox
				alignment={AlignmentMode.Center}
				style={{
					expandBehaviorH: SizeFlags.Fill,
					expandBehaviorV: SizeFlags.ExpandFill,
					separation: 6,
					mouseFilter: MouseFilterEnum.Ignore,
				}}
			>
				<div
					style={{
						backgroundStyle: styles.bubble ?? "res://assets/panel.tres",
						minWidth: 26,
						minHeight: 26,
						expandBehaviorH: SizeFlags.ShrinkBegin,
						expandBehaviorV: SizeFlags.ShrinkBegin,
					}}
				>
					<label
						ref={hourGlassRef}
						class="rpgawesome text-base"
						style={{
							anchorPreset: LayoutPreset.FullRect,
							...iconAlign,
						}}
					>
						{"\uEA09"}
					</label>
				</div>

				<label class="text-white text-lg">{stormTime}</label>

				<div
					style={{
						backgroundStyle: styles.bubble ?? "res://assets/panel.tres",
						minWidth: 26,
						minHeight: 26,
						expandBehaviorH: SizeFlags.ShrinkBegin,
						expandBehaviorV: SizeFlags.ShrinkBegin,
					}}
				>
					<label
						class="rpgawesome text-white text-base"
						style={{
							anchorPreset: LayoutPreset.FullRect,
							...iconAlign,
						}}
					>
						{"\uEA48"}
					</label>
				</div>

				<label class="text-white text-lg">{playersLeft}</label>

				<div
					style={{
						backgroundStyle: styles.bubble ?? "res://assets/panel.tres",
						minWidth: 26,
						minHeight: 26,
						expandBehaviorH: SizeFlags.ShrinkBegin,
						expandBehaviorV: SizeFlags.ShrinkBegin,
					}}
				>
					<label
						class="rpgawesome text-white text-base"
						style={{
							anchorPreset: LayoutPreset.FullRect,
							...iconAlign,
						}}
					>
						{"\uEAA1"}
					</label>
				</div>

				<label class="text-white text-lg">{eliminations}</label>
			</hbox>
		</vbox>
	)
}
