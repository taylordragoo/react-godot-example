import React, { useEffect, useRef } from "react"
import {
	AlignmentMode,
	MouseFilterEnum,
	SizeFlags,
} from "gd"
import { useBridgeState } from "bridge"

const MAP_TEX = GD.Load<Texture2D>("res://assets/@fortnite-sample/map.jpg")

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
			class="absolute top-4 right-4 w-[300px] h-[400px] gap-2 z-30"
			style={{
				mouseFilter: MouseFilterEnum.Ignore,
			}}
		>
			<div
				class="bg-[#D8CBB0] overflow-hidden w-[300px] h-[300px]"
				style={{
					expandBehaviorH: SizeFlags.Fill,
					expandBehaviorV: SizeFlags.ShrinkBegin,
				}}
				>
					<control
					class="grow"
						style={{
							mouseFilter: MouseFilterEnum.Ignore,
						}}
					>
						<texture
							ref={mapRef}
							texture={MAP_TEX}
							class="absolute -top-[850px] -left-[850px] w-[1400px] h-[1400px] object-cover"
							style={{
								mouseFilter: MouseFilterEnum.Ignore,
							}}
						/>

					<label
						class="absolute top-[140px] left-[140px] w-[40px] h-[40px] rpgawesome text-white text-xl z-10"
						style={{
							...iconAlign,
							mouseFilter: MouseFilterEnum.Ignore,
						}}
					>
						{"\uEAC5"}
					</label>
				</control>
			</div>

			<hbox
				class="gap-1.5"
				alignment={AlignmentMode.Center}
				style={{
					expandBehaviorH: SizeFlags.Fill,
					expandBehaviorV: SizeFlags.ExpandFill,
					mouseFilter: MouseFilterEnum.Ignore,
				}}
			>
				<div
					class="bg-black/30 rounded-full w-[26px] h-[26px]"
					style={{
						expandBehaviorH: SizeFlags.ShrinkBegin,
						expandBehaviorV: SizeFlags.ShrinkBegin,
					}}
				>
					<label
						ref={hourGlassRef}
						class="rpgawesome text-base"
						style={{
							...iconAlign,
						}}
					>
						{"\uEA09"}
					</label>
				</div>

				<label class="text-white text-lg">{stormTime}</label>

				<div
					class="bg-black/30 rounded-full w-[26px] h-[26px]"
					style={{
						expandBehaviorH: SizeFlags.ShrinkBegin,
						expandBehaviorV: SizeFlags.ShrinkBegin,
					}}
				>
					<label
						class="rpgawesome text-white text-base"
						style={{
							...iconAlign,
						}}
					>
						{"\uEA48"}
					</label>
				</div>

				<label class="text-white text-lg">{playersLeft}</label>

				<div
					class="bg-black/30 rounded-full w-[26px] h-[26px]"
					style={{
						expandBehaviorH: SizeFlags.ShrinkBegin,
						expandBehaviorV: SizeFlags.ShrinkBegin,
					}}
				>
					<label
						class="rpgawesome text-white text-base"
						style={{
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
