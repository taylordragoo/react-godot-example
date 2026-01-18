import { AnimatableNode } from "enums"
import { GrowDirection, SizeFlags } from "gd"
import React, { useMemo } from "react"
import { useBridgeState } from "bridge"

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const createFlatStyleBox = (bgColor: string) => {
	const StyleBoxFlatCtor = (globalThis as any).StyleBoxFlat
	if (!StyleBoxFlatCtor) return null

	const sb = new StyleBoxFlatCtor()
	sb.BgColor = new Color(bgColor)
	return sb
}

export const CharacterStats = () => {
	const fortnite = useBridgeState((s: any) => s?.fortnite)
	const health = typeof fortnite?.health === "number" ? fortnite.health : 0
	const maxHealth = typeof fortnite?.maxHealth === "number" ? fortnite.maxHealth : 0
	const shield = typeof fortnite?.shield === "number" ? fortnite.shield : 0
	const maxShield = typeof fortnite?.maxShield === "number" ? fortnite.maxShield : 0
	const ammo = typeof fortnite?.ammo === "number" ? fortnite.ammo : 0

	const barWidth = 356
	const shieldFrac = clamp01(maxShield > 0 ? shield / maxShield : 0)
	const shieldFillWidth = Math.round(barWidth * shieldFrac)
	const healthFrac = clamp01(maxHealth > 0 ? health / maxHealth : 0)
	const healthFillWidth = Math.round(barWidth * healthFrac)

	const styles = useMemo(() => {
		const panel = createFlatStyleBox("#00000066")
		if (panel) {
			panel.CornerRadiusTopLeft = 8
			panel.CornerRadiusTopRight = 8
			panel.CornerRadiusBottomLeft = 8
			panel.CornerRadiusBottomRight = 8
			panel.ContentMarginLeft = 10
			panel.ContentMarginRight = 10
			panel.ContentMarginTop = 10
			panel.ContentMarginBottom = 10
		}

		return {
			panel,
			barBg: createFlatStyleBox("#00000066"),
			shieldFill: createFlatStyleBox("#00A0E6FF"),
			healthFill: createFlatStyleBox("#48E025FF"),
		}
	}, [])

	return (
		<div
			style={{
				backgroundStyle: styles.panel ?? "res://assets/panel.tres",
				anchorLeft: 0,
				anchorRight: 0,
				anchorTop: 1,
				anchorBottom: 1,
				offsetLeft: 80,
				offsetRight: 80 + 580,
				offsetTop: -80 - 80,
				offsetBottom: -80,
				growHorizontal: GrowDirection.Begin,
				growVertical: GrowDirection.Begin,
				zIndex: 10,
			}}
		>
			<hbox
				style={{
					expandBehaviorH: SizeFlags.ExpandFill,
					expandBehaviorV: SizeFlags.ExpandFill,
					separation: 12,
				}}
			>
				<vbox
					style={{
						expandBehaviorH: SizeFlags.ExpandFill,
						expandBehaviorV: SizeFlags.ExpandFill,
						separation: 6,
					}}
				>
					{/* Shield row */}
					<hbox
						style={{ separation: 8, expandBehaviorH: SizeFlags.ExpandFill }}
					>
						<label
							class="rpgawesome text-white text-xl"
							style={{ minWidth: 40 }}
						>
							{"\uEAE0"}
						</label>

						<div
							style={{
								backgroundStyle: styles.barBg ?? "res://assets/panel.tres",
								minWidth: barWidth,
								minHeight: 18,
								expandBehaviorH: SizeFlags.ShrinkBegin,
							}}
						>
							<hbox style={{ expandBehaviorH: SizeFlags.ExpandFill }}>
								<div
									style={{
										backgroundStyle: styles.shieldFill ?? "res://assets/panel.tres",
										minWidth: shieldFillWidth,
										minHeight: 18,
										expandBehaviorH: SizeFlags.ShrinkBegin,
										expandBehaviorV: SizeFlags.ExpandFill,
									}}
								/>
								<control style={{ expandBehaviorH: SizeFlags.ExpandFill }} />
							</hbox>
						</div>

						<label class="text-white text-xl" style={{ minWidth: 50 }}>
							{Math.round(shield)}
						</label>
					</hbox>

					<control style={{ minHeight: 6 }} />

					{/* Health row */}
					<hbox
						style={{ separation: 8, expandBehaviorH: SizeFlags.ExpandFill }}
					>
						<label
							class="rpgawesome text-white text-xl"
							style={{ minWidth: 40 }}
						>
							{"\uE9F5"}
						</label>

						<div
							style={{
								backgroundStyle: styles.barBg ?? "res://assets/panel.tres",
								minWidth: barWidth,
								minHeight: 28,
								expandBehaviorH: SizeFlags.ShrinkBegin,
							}}
						>
							<hbox style={{ expandBehaviorH: SizeFlags.ExpandFill }}>
								<div
									style={{
										backgroundStyle: styles.healthFill ?? "res://assets/panel.tres",
										minWidth: healthFillWidth,
										minHeight: 28,
										expandBehaviorH: SizeFlags.ShrinkBegin,
										expandBehaviorV: SizeFlags.ExpandFill,
										transitions: [AnimatableNode.MinWidth],
										transitionTimeMS: [500],
									}}
								/>
								<control style={{ expandBehaviorH: SizeFlags.ExpandFill }} />
							</hbox>
						</div>

						<label class="text-white text-xl" style={{ minWidth: 50 }}>
							{Math.round(health)}
						</label>
					</hbox>
				</vbox>

				{/* Right block */}
				<hbox
					style={{
						minWidth: 116,
						separation: 8,
						expandBehaviorV: SizeFlags.ExpandFill,
					}}
				>
					<label
						class="rpgawesome text-[#89FFFF] text-6xl"
					>
						{"\uE9C1"}
					</label>
					<label class="text-white text-3xl">
						{Math.round(ammo)}
					</label>
				</hbox>
			</hbox>
		</div>
	)
}
