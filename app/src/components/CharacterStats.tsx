import { AnimatableNode } from "enums"
import { GrowDirection, SizeFlags } from "gd"
import React from "react"
import { useBridgeState } from "bridge"

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

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

	return (
		<div
			class="absolute left-20 bottom-20 w-[580px] h-[80px] bg-black/40 rounded-lg p-3 z-10"
		>
			<hbox
				class="gap-3"
				style={{
					expandBehaviorH: SizeFlags.ExpandFill,
					expandBehaviorV: SizeFlags.ExpandFill,
				}}
			>
				<vbox
					class="gap-1.5"
					style={{
						expandBehaviorH: SizeFlags.ExpandFill,
						expandBehaviorV: SizeFlags.ExpandFill,
					}}
				>
					{/* Shield row */}
					<hbox
						class="gap-2"
						style={{ expandBehaviorH: SizeFlags.ExpandFill }}
					>
						<label
							class="rpgawesome text-white text-xl"
							style={{ minWidth: 40 }}
						>
							{"\uEAE0"}
						</label>

						<div
							class="bg-black/40"
							style={{
								minWidth: barWidth,
								minHeight: 18,
								expandBehaviorH: SizeFlags.ShrinkBegin,
							}}
						>
							<hbox style={{ expandBehaviorH: SizeFlags.ExpandFill }}>
								<div
									class="bg-[#00A0E6]"
									style={{
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
						class="gap-2"
						style={{ expandBehaviorH: SizeFlags.ExpandFill }}
					>
						<label
							class="rpgawesome text-white text-xl"
							style={{ minWidth: 40 }}
						>
							{"\uE9F5"}
						</label>

						<div
							class="bg-black/40"
							style={{
								minWidth: barWidth,
								minHeight: 28,
								expandBehaviorH: SizeFlags.ShrinkBegin,
							}}
						>
							<hbox style={{ expandBehaviorH: SizeFlags.ExpandFill }}>
								<div
									class="bg-[#48E025]"
									style={{
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
					class="gap-2"
					style={{
						minWidth: 116,
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
