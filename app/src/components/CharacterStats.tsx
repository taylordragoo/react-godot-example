import { AnimatableNode } from "enums"
import { SizeFlags } from "gd"
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
				<hbox class="gap-3 grow">
					<vbox
						class="gap-1.5 grow"
					>
						{/* Shield row */}
						<hbox
							class="gap-2 grow-x"
						>
						<label
							class="rpgawesome text-white text-xl w-10"
						>
							{"\uEAE0"}
						</label>

							<div
								class="bg-black/40 w-[356px] h-4.5"
								style={{
									expandBehaviorH: SizeFlags.ShrinkBegin,
								}}
							>
								<hbox class="grow-x">
									<div
										class="bg-[#00A0E6] h-4.5"
										style={{
											minWidth: shieldFillWidth,
											expandBehaviorH: SizeFlags.ShrinkBegin,
											expandBehaviorV: SizeFlags.ExpandFill,
										}}
									/>
									<control class="grow-x" />
								</hbox>
							</div>

						<label class="text-white text-xl w-[50px]">
							{Math.round(shield)}
						</label>
					</hbox>

					<control class="h-1.5" />

						{/* Health row */}
						<hbox
							class="gap-2 grow-x"
						>
						<label
							class="rpgawesome text-white text-xl w-10"
						>
							{"\uE9F5"}
						</label>

							<div
								class="bg-black/40 w-[356px] h-7"
								style={{
									expandBehaviorH: SizeFlags.ShrinkBegin,
								}}
							>
								<hbox class="grow-x">
									<div
										class="bg-[#48E025] h-7"
										style={{
											minWidth: healthFillWidth,
											expandBehaviorH: SizeFlags.ShrinkBegin,
											expandBehaviorV: SizeFlags.ExpandFill,
											transitions: [AnimatableNode.MinWidth],
											transitionTimeMS: [500],
										}}
									/>
									<control class="grow-x" />
								</hbox>
							</div>

						<label class="text-white text-xl w-[50px]">
							{Math.round(health)}
						</label>
					</hbox>
				</vbox>

				{/* Right block */}
				<hbox class="gap-2 w-29 grow-y">
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
