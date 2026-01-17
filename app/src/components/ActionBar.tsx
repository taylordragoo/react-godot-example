import React, { useMemo } from "react"
import {
	AlignmentMode,
	GrowDirection,
	LayoutPreset,
	SizeFlags,
	StretchModeEnum,
} from "gd"
import { useBridgeState } from "bridge"

enum Rarity {
	Common,
	Uncommon,
	Rare,
	Epic,
	Legendary,
}

const RARITY_COLORS = ["#A3A9AF", "#57B001", "#00A2EA", "#A24DC6", "#FEA741"]

const ITEM_TEXTURES: Record<string, Texture2D> = {
	daggers: GD.Load<Texture2D>("res://assets/@fortnite-sample/daggers.png"),
	mk7: GD.Load<Texture2D>("res://assets/@fortnite-sample/mk7.png"),
	drum: GD.Load<Texture2D>("res://assets/@fortnite-sample/drum.png"),
	splash: GD.Load<Texture2D>("res://assets/@fortnite-sample/splash.png"),
}

const createFlatStyleBox = (bgColor: string) => {
	const StyleBoxFlatCtor = (globalThis as any).StyleBoxFlat
	if (!StyleBoxFlatCtor) return null

	const sb = new StyleBoxFlatCtor()
	sb.BgColor = new Color(bgColor)
	return sb
}

export interface ActionBarProps {
	scale?: number
}

interface SlotProps {
	itemName?: keyof typeof ITEM_TEXTURES
	rarity?: Rarity
	char?: string
	selected?: boolean
	scale: number
}

const Slot = ({ itemName, rarity = Rarity.Common, char = "X", selected, scale }: SlotProps) => {
	const spx = (px: number) => Math.round(px * scale)

	const slotWidth = spx(80)
	const slotHeight = spx(120)
	const iconSize = spx(80)

	const iconGap = selected ? spx(18) : spx(6)

	const styles = useMemo(() => {
		const rarityColor = RARITY_COLORS[rarity] ?? RARITY_COLORS[Rarity.Common]

		const icon = itemName ? createFlatStyleBox(rarityColor) : createFlatStyleBox("#00000000")
		if (icon) {
			icon.CornerRadiusTopLeft = spx(6)
			icon.CornerRadiusTopRight = spx(6)
			icon.CornerRadiusBottomLeft = spx(6)
			icon.CornerRadiusBottomRight = spx(6)

			if (itemName) {
				if (selected) {
					icon.BorderColor = new Color("#FFFFFFFF")
					icon.BorderWidthLeft = spx(2)
					icon.BorderWidthTop = spx(2)
					icon.BorderWidthRight = spx(2)
					icon.BorderWidthBottom = spx(2)
				}
			} else {
				icon.BorderColor = new Color("#FFFFFF80")
				icon.BorderWidthLeft = spx(1)
				icon.BorderWidthTop = spx(1)
				icon.BorderWidthRight = spx(1)
				icon.BorderWidthBottom = spx(1)
			}
		}

		const key = createFlatStyleBox("#00000080")
		if (key) {
			key.CornerRadiusTopLeft = spx(4)
			key.CornerRadiusTopRight = spx(4)
			key.CornerRadiusBottomLeft = spx(4)
			key.CornerRadiusBottomRight = spx(4)
			key.BorderColor = new Color("#FFFFFF4D")
			key.BorderWidthLeft = spx(1)
			key.BorderWidthTop = spx(1)
			key.BorderWidthRight = spx(1)
			key.BorderWidthBottom = spx(1)
			key.ContentMarginLeft = spx(6)
			key.ContentMarginRight = spx(6)
			key.ContentMarginTop = spx(2)
			key.ContentMarginBottom = spx(2)
		}

		return { icon, key }
	}, [itemName, rarity, selected, scale])

	const tex = itemName ? ITEM_TEXTURES[itemName] : null

	return (
		<control style={{ minWidth: slotWidth, minHeight: slotHeight }}>
			<vbox
				alignment={AlignmentMode.Center}
				style={{
					anchorPreset: LayoutPreset.FullRect,
					expandBehaviorH: SizeFlags.ExpandFill,
					expandBehaviorV: SizeFlags.ExpandFill,
					separation: iconGap,
				}}
			>
				<control style={{ expandBehaviorV: SizeFlags.ExpandFill }} />

				<div
					style={{
						backgroundStyle: styles.icon ?? "res://assets/panel.tres",
						minWidth: iconSize,
						minHeight: iconSize,
					}}
				>
					{tex ? (
						<texture
							texture={tex}
							style={{
								expandBehaviorH: SizeFlags.ExpandFill,
								expandBehaviorV: SizeFlags.ExpandFill,
								stretchMode: StretchModeEnum.KeepAspectCovered,
							}}
						/>
					) : null}
				</div>

				<div style={{ backgroundStyle: styles.key ?? "res://assets/panel.tres" }}>
					<label class="text-white text-xs">{char}</label>
				</div>
			</vbox>
		</control>
	)
}

export const ActionBar = ({ scale = 1 }: ActionBarProps) => {
	const spx = (px: number) => Math.round(px * scale)

	const slotIndex = useBridgeState((s: any) => {
		const idx = s?.fortnite?.slotIndex
		return typeof idx === "number" ? idx : 0
	})

	return (
		<hbox
			alignment={AlignmentMode.End}
			style={{
				anchorLeft: 1,
				anchorRight: 1,
				anchorTop: 1,
				anchorBottom: 1,
				offsetRight: -spx(16),
				offsetLeft: -spx(16) - spx(520),
				offsetBottom: -spx(80),
				offsetTop: -spx(80) - spx(120),
				growHorizontal: GrowDirection.Begin,
				growVertical: GrowDirection.Begin,
				separation: spx(8),
				zIndex: 20,
			}}
		>
			<Slot itemName="daggers" rarity={Rarity.Epic} char="F" selected={slotIndex === 0} scale={scale} />
			<Slot itemName="mk7" rarity={Rarity.Legendary} char="1" selected={slotIndex === 1} scale={scale} />
			<Slot itemName="drum" char="2" selected={slotIndex === 2} scale={scale} />
			<Slot itemName="splash" rarity={Rarity.Rare} char="3" selected={slotIndex === 3} scale={scale} />
			<Slot char="4" selected={slotIndex === 4} scale={scale} />
			<Slot char="5" selected={slotIndex === 5} scale={scale} />
		</hbox>
	)
}
