import React from "react"
import { LayoutPreset, MouseFilterEnum, SizeFlags, StretchModeEnum } from "gd"
import { ActionBar } from "../components/ActionBar"
import { CharacterStats } from "../components/CharacterStats"
import { Minimap } from "../components/Minimap"

const bgTex = GD.Load<Texture2D>("res://assets/@fortnite-sample/screenie2.jpg")

export const FortniteSample = () => {
	const uiScale = 0.5

	return (
		<>
			<texture
				texture={bgTex}
				style={{
					anchorPreset: LayoutPreset.FullRect,
					expandBehaviorH: SizeFlags.ExpandFill,
					expandBehaviorV: SizeFlags.ExpandFill,
					stretchMode: StretchModeEnum.KeepAspectCovered,
					mouseFilter: MouseFilterEnum.Ignore,
					zIndex: -100,
				}}
			/>
			<CharacterStats scale={uiScale} />
			<ActionBar scale={uiScale} />
			<Minimap scale={uiScale} />
		</>
	)
}
