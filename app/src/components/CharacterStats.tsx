import { AnimatableNode } from "enums"
import { GrowDirection, SizeFlags } from "gd"
import React, { useEffect, useMemo, useRef, useState } from "react"

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const createFlatStyleBox = (bgColor: string) => {
	const StyleBoxFlatCtor = (globalThis as any).StyleBoxFlat
	if (!StyleBoxFlatCtor) return null

	const sb = new StyleBoxFlatCtor()
	sb.BgColor = new Color(bgColor)
	return sb
}

export interface CharacterStatsProps {
	scale?: number
}

export const CharacterStats = ({ scale = 1 }: CharacterStatsProps) => {
	const spx = (px: number) => Math.round(px * scale)

	// Temporary demo state (replace with bridge/game state later).
	const [health, setHealth] = useState(50)
	const maxHealth = 100

	const direction = useRef(1)
	useEffect(() => {
		const id = setInterval(() => {
			setHealth((h) => {
				let next = h + direction.current * 5
				if (next >= maxHealth) {
					next = maxHealth
					direction.current = -1
				} else if (next <= 0) {
					next = 0
					direction.current = 1
				}
				return next
			})
		}, 600)
		return () => clearInterval(id)
	}, [])

	const barWidth = spx(356)
	const healthFrac = clamp01(maxHealth > 0 ? health / maxHealth : 0)
	const healthFillWidth = Math.round(barWidth * healthFrac)

	const styles = useMemo(() => {
		const panel = createFlatStyleBox("#00000066")
		if (panel) {
			panel.CornerRadiusTopLeft = spx(8)
			panel.CornerRadiusTopRight = spx(8)
			panel.CornerRadiusBottomLeft = spx(8)
			panel.CornerRadiusBottomRight = spx(8)
			panel.ContentMarginLeft = spx(10)
			panel.ContentMarginRight = spx(10)
			panel.ContentMarginTop = spx(10)
			panel.ContentMarginBottom = spx(10)
		}

		return {
			panel,
			barBg: createFlatStyleBox("#00000066"),
			shieldFill: createFlatStyleBox("#00A0E6FF"),
			healthFill: createFlatStyleBox("#48E025FF"),
		}
	}, [scale])

	return (
		<div
			style={{
				backgroundStyle: styles.panel ?? "res://assets/panel.tres",
				anchorLeft: 0,
				anchorRight: 0,
				anchorTop: 1,
				anchorBottom: 1,
				offsetLeft: spx(80),
				offsetRight: spx(80) + spx(580),
				offsetTop: -spx(80) - spx(80),
				offsetBottom: -spx(80),
				growHorizontal: GrowDirection.Begin,
				growVertical: GrowDirection.Begin,
				zIndex: 10,
			}}
		>
			<hbox
				style={{
					expandBehaviorH: SizeFlags.ExpandFill,
					expandBehaviorV: SizeFlags.ExpandFill,
					separation: spx(12),
				}}
			>
				<vbox
					style={{
						expandBehaviorH: SizeFlags.ExpandFill,
						expandBehaviorV: SizeFlags.ExpandFill,
						separation: spx(6),
					}}
				>
					{/* Shield row */}
					<hbox
						style={{ separation: spx(8), expandBehaviorH: SizeFlags.ExpandFill }}
					>
						<label
							class="rpgawesome text-white text-xl"
							style={{ minWidth: spx(40) }}
						>
							{"\uEAE0"}
						</label>

						<div
							style={{
								backgroundStyle: styles.barBg ?? "res://assets/panel.tres",
								minWidth: barWidth,
								minHeight: spx(18),
								expandBehaviorH: SizeFlags.ShrinkBegin,
							}}
						>
							<hbox style={{ expandBehaviorH: SizeFlags.ExpandFill }}>
								<div
									style={{
										backgroundStyle: styles.shieldFill ?? "res://assets/panel.tres",
										minWidth: Math.round(barWidth * 0.5),
										minHeight: spx(18),
										expandBehaviorH: SizeFlags.ShrinkBegin,
										expandBehaviorV: SizeFlags.ExpandFill,
									}}
								/>
								<control style={{ expandBehaviorH: SizeFlags.ExpandFill }} />
							</hbox>
						</div>

						<label class="text-white text-xl" style={{ minWidth: spx(50) }}>
							50
						</label>
					</hbox>

					<control style={{ minHeight: spx(6) }} />

					{/* Health row */}
					<hbox
						style={{ separation: spx(8), expandBehaviorH: SizeFlags.ExpandFill }}
					>
						<label
							class="rpgawesome text-white text-xl"
							style={{ minWidth: spx(40) }}
						>
							{"\uE9F5"}
						</label>

						<div
							style={{
								backgroundStyle: styles.barBg ?? "res://assets/panel.tres",
								minWidth: barWidth,
								minHeight: spx(28),
								expandBehaviorH: SizeFlags.ShrinkBegin,
							}}
						>
							<hbox style={{ expandBehaviorH: SizeFlags.ExpandFill }}>
								<div
									style={{
										backgroundStyle: styles.healthFill ?? "res://assets/panel.tres",
										minWidth: healthFillWidth,
										minHeight: spx(28),
										expandBehaviorH: SizeFlags.ShrinkBegin,
										expandBehaviorV: SizeFlags.ExpandFill,
										transitions: [AnimatableNode.MinWidth],
										transitionTimeMS: [500],
									}}
								/>
								<control style={{ expandBehaviorH: SizeFlags.ExpandFill }} />
							</hbox>
						</div>

						<label class="text-white text-xl" style={{ minWidth: spx(50) }}>
							{Math.round(health)}
						</label>
					</hbox>
				</vbox>

				{/* Right block */}
				<hbox
					style={{
						minWidth: spx(116),
						separation: spx(8),
						expandBehaviorV: SizeFlags.ExpandFill,
					}}
				>
					<label
						class="rpgawesome text-[#89FFFF]"
						style={{ fontSize: spx(60) }}
					>
						{"\uE9C1"}
					</label>
					<label class="text-white" style={{ fontSize: spx(30) }}>
						50
					</label>
				</hbox>
			</hbox>
		</div>
	)
}
