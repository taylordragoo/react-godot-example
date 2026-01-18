import React, { useCallback } from "react"
import {
	AlignmentMode,
	LayoutPreset,
	MouseFilterEnum,
	SizeFlags,
	StretchModeEnum,
} from "gd"
import { dispatch, useBridgeEvents, useBridgeState } from "bridge"

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

	const rarityColor = RARITY_COLORS[rarity] ?? RARITY_COLORS[Rarity.Common]
	const iconBorderWidth = itemName ? (selected ? 2 : 0) : 1
	const iconBorderColor = itemName ? (selected ? "#FFFFFFFF" : "#00000000") : "#FFFFFF80"

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
							bgColor: itemName ? rarityColor : "#00000000",
							cornerRadius: 6,
							borderWidth: iconBorderWidth,
							borderColor: iconBorderColor,
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
						style={{
							bgColor: "#00000080",
							cornerRadius: 4,
							borderWidth: 1,
							borderColor: "#FFFFFF4D",
							paddingLeft: 6,
							paddingRight: 6,
							paddingTop: 2,
							paddingBottom: 2,
						}}
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

	const selectSlot = useCallback((index: number) => {
		dispatch({ type: "fortnite/set_slot_index", payload: { index } })
	}, [])

	useBridgeEvents(
		useCallback(
			(ev) => {
				if (ev.type !== "input/key_down") return
				if (ev.payload?.echo) return

				const key = String(ev.payload?.key ?? "").toLowerCase()
				if (!key) return

				if (key === "f") return selectSlot(0)
				if (key === "1") return selectSlot(1)
				if (key === "2") return selectSlot(2)
				if (key === "3") return selectSlot(3)
				if (key === "4") return selectSlot(4)
				if (key === "5") return selectSlot(5)
			},
			[selectSlot]
		)
	)

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
			class="absolute bottom-20 right-4 w-[520px] h-[120px] justify-between z-20"
			style={{
				mouseFilter: MouseFilterEnum.Stop,
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
