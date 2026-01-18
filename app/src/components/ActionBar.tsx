import React, { useMemo } from "react"
import {
	AlignmentMode,
	GrowDirection,
	LayoutPreset,
	MouseFilterEnum,
	SizeFlags,
	StretchModeEnum,
} from "gd"
import { dispatch, useBridgeState } from "bridge"

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
}

interface SlotProps {
	index: number
	itemName?: keyof typeof ITEM_TEXTURES
	rarity?: Rarity
	char?: string
	selected?: boolean
	onSelect?: (index: number) => void
	onGuiInput?: (event: any) => void
}

const Slot = ({
	index,
	itemName,
	rarity = Rarity.Common,
	char = "X",
	selected,
	onSelect,
	onGuiInput,
}: SlotProps) => {
	const slotWidth = 80
	const slotHeight = 120
	const iconSize = 80

	const iconGap = selected ? 18 : 6

	const styles = useMemo(() => {
		const rarityColor = RARITY_COLORS[rarity] ?? RARITY_COLORS[Rarity.Common]

		const icon = itemName ? createFlatStyleBox(rarityColor) : createFlatStyleBox("#00000000")
		if (icon) {
			icon.CornerRadiusTopLeft = 6
			icon.CornerRadiusTopRight = 6
			icon.CornerRadiusBottomLeft = 6
			icon.CornerRadiusBottomRight = 6

			if (itemName) {
				if (selected) {
					icon.BorderColor = new Color("#FFFFFFFF")
					icon.BorderWidthLeft = 2
					icon.BorderWidthTop = 2
					icon.BorderWidthRight = 2
					icon.BorderWidthBottom = 2
				}
			} else {
				icon.BorderColor = new Color("#FFFFFF80")
				icon.BorderWidthLeft = 1
				icon.BorderWidthTop = 1
				icon.BorderWidthRight = 1
				icon.BorderWidthBottom = 1
			}
		}

		const key = createFlatStyleBox("#00000080")
		if (key) {
			key.CornerRadiusTopLeft = 4
			key.CornerRadiusTopRight = 4
			key.CornerRadiusBottomLeft = 4
			key.CornerRadiusBottomRight = 4
			key.BorderColor = new Color("#FFFFFF4D")
			key.BorderWidthLeft = 1
			key.BorderWidthTop = 1
			key.BorderWidthRight = 1
			key.BorderWidthBottom = 1
			key.ContentMarginLeft = 6
			key.ContentMarginRight = 6
			key.ContentMarginTop = 2
			key.ContentMarginBottom = 2
		}

		return { icon, key }
	}, [itemName, rarity, selected])

	const tex = itemName ? ITEM_TEXTURES[itemName] : null

	const handleSelect = () => onSelect?.(index)

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
						onClick={handleSelect}
						onGuiInput={onGuiInput}
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

					<div
						onClick={handleSelect}
						onGuiInput={onGuiInput}
						style={{ backgroundStyle: styles.key ?? "res://assets/panel.tres" }}
					>
						<label class="text-white text-xs">{char}</label>
					</div>
				</vbox>
			</control>
	)
}

export const ActionBar = (_props: ActionBarProps) => {
	const slotIndex = useBridgeState((s: any) => {
		const idx = s?.fortnite?.slotIndex
		return typeof idx === "number" ? idx : 0
	})

	const selectSlot = (index: number) => {
		dispatch({ type: "fortnite/set_slot_index", payload: { index } })
	}

	const handleGuiInput = (ev: any) => {
		const pressed = Boolean(ev?.Pressed)
		if (!pressed) return

		const buttonIndex = Number(ev?.ButtonIndex)
		if (!Number.isFinite(buttonIndex)) return

		// Godot MouseButton: WheelUp=4, WheelDown=5
		if (buttonIndex === 4) dispatch({ type: "fortnite/slot_prev" })
		if (buttonIndex === 5) dispatch({ type: "fortnite/slot_next" })
	}

	return (
		<hbox
			alignment={AlignmentMode.End}
			style={{
				anchorLeft: 1,
				anchorRight: 1,
				anchorTop: 1,
				anchorBottom: 1,
				offsetRight: -16,
				offsetLeft: -16 - 520,
				offsetBottom: -80,
				offsetTop: -80 - 120,
				growHorizontal: GrowDirection.Begin,
				growVertical: GrowDirection.Begin,
				separation: 8,
				mouseFilter: MouseFilterEnum.Stop,
				zIndex: 20,
			}}
		>
			<Slot
				index={0}
				itemName="daggers"
				rarity={Rarity.Epic}
				char="F"
				selected={slotIndex === 0}
				onSelect={selectSlot}
				onGuiInput={handleGuiInput}
			/>
			<Slot
				index={1}
				itemName="mk7"
				rarity={Rarity.Legendary}
				char="1"
				selected={slotIndex === 1}
				onSelect={selectSlot}
				onGuiInput={handleGuiInput}
			/>
			<Slot
				index={2}
				itemName="drum"
				char="2"
				selected={slotIndex === 2}
				onSelect={selectSlot}
				onGuiInput={handleGuiInput}
			/>
			<Slot
				index={3}
				itemName="splash"
				rarity={Rarity.Rare}
				char="3"
				selected={slotIndex === 3}
				onSelect={selectSlot}
				onGuiInput={handleGuiInput}
			/>
			<Slot
				index={4}
				char="4"
				selected={slotIndex === 4}
				onSelect={selectSlot}
				onGuiInput={handleGuiInput}
			/>
			<Slot
				index={5}
				char="5"
				selected={slotIndex === 5}
				onSelect={selectSlot}
				onGuiInput={handleGuiInput}
			/>
		</hbox>
	)
}
