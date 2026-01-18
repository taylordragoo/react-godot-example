import React, { useCallback } from "react"
import {
	AlignmentMode,
	MouseFilterEnum,
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
	const rarityColor = RARITY_COLORS[rarity] ?? RARITY_COLORS[Rarity.Common]

	const tex = itemName ? ITEM_TEXTURES[itemName] : null

	const handleSelect = () => onSelect?.(index)

	const gapClass = selected ? "gap-4.5" : "gap-1.5"
	const iconClass = tex
		? `w-20 h-20 rounded-md bg-[${rarityColor}] ${
				selected ? "border-2 border-white" : "border-0 border-transparent"
			}`
		: "w-20 h-20 rounded-md bg-transparent border border-white/50"

	return (
		<control class="w-20 h-30">
				<vbox
					alignment={AlignmentMode.Center}
					class={`absolute inset-0 ${gapClass}`}
				>
					<control class="grow-y" />

					<div onClick={handleSelect} onGuiInput={onGuiInput} class={iconClass}>
						{tex ? (
						<texture
							texture={tex}
							class="grow object-cover"
						/>
					) : null}
					</div>

				<div
					onClick={handleSelect}
					onGuiInput={onGuiInput}
					class="bg-black/50 rounded border border-white/30 px-1.5 py-0.5"
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
