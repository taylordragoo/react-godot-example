import { render } from "renderer"
import React from "react"
import { initTailwind } from "tw"
import { FortniteSample } from "./examples/fortnite-sample"

initTailwind(root, {
	rpgawesome: {
		font: "res://assets/@fortnite-sample/rpgawesome.ttf",
	},
})

render(<FortniteSample />)
