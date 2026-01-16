import React, { useEffect, useMemo } from "react"
import { LayoutPreset, MouseFilterEnum, SizeFlags } from "gd"
import { dispatch, useBridgeState } from "bridge"

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

export const App = () => {
	const progress = useBridgeState((s: any) => {
		const v = s?.progress
		return typeof v === "number" ? clamp01(v) : 0
	})

	const ballCount = pman?.BallCount ?? 0
	const labelRefs = useMemo(
		() => Array.from({ length: ballCount }, () => React.createRef<IDom>()),
		[ballCount]
	)

	useEffect(() => {
		let rafId = 0

		const tick = () => {
			const positions = pman.GetBallPositions() as unknown as number[]
			for (let i = 0; i < ballCount; i++) {
				const label = labelRefs[i].current
				if (!label) continue

				const x = positions[i * 2]
				const y = positions[i * 2 + 1]
				label.updateProps({
					style: {
						x: x,
						y: y - 24,
						visible: true,
					},
				})
			}

			rafId = requestAnimationFrame(tick)
		}

		rafId = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(rafId)
	}, [ballCount, labelRefs])

	return (
		<>
			<control
				style={{
					anchorPreset: LayoutPreset.FullRect,
					mouseFilter: MouseFilterEnum.Ignore,
				}}
			>
				{Array.from({ length: ballCount }, (_, i) => (
					<label
						key={i}
						ref={labelRefs[i]}
						style={{
							zIndex: 100,
							visible: false,
						}}
					>
						Ball {i}
					</label>
				))}
			</control>

			{/* UI panel */}
			<margin
				style={{
					anchorPreset: LayoutPreset.FullRect,
					margin: 24,
				}}
			>
				<div
					style={{
						backgroundStyle: "res://assets/panel.tres",
					}}
				>
					<vbox
						style={{
							separation: 12,
						}}
					>
						<label rich>
							Progress: [b]{Math.round(progress * 100)}%[/b]
						</label>

						<slider
							min={0}
							max={1}
							step={0.01}
							value={progress}
							onChange={(value) =>
								dispatch({
									type: "set_progress",
									payload: { value },
								})
							}
							style={{
								expandBehaviorH: SizeFlags.ExpandFill,
							}}
						/>

						<hbox
							style={{
								separation: 12,
							}}
						>
							<button
								onClick={() =>
									dispatch({
										type: "reset_progress",
									})
								}
							>
								Reset
							</button>
							<button
								onClick={() =>
									dispatch({
										type: "set_progress",
										payload: { value: clamp01(progress + 0.1) },
									})
								}
							>
								+10%
							</button>
						</hbox>
					</vbox>
				</div>
			</margin>
		</>
	)
}

