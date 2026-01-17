import { SizeFlags } from "gd"

type StyleObject = Record<string, any>
type StyleSheet = Record<string, StyleObject>

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const hexByte = (v: number) =>
	clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0").toUpperCase()

const normalizeHexColor = (value: string): string | null => {
	if (!value) return null
	if (!value.startsWith("#")) return null

	const hex = value.slice(1)
	if (hex.length === 3) {
		const r = hex[0]
		const g = hex[1]
		const b = hex[2]
		return `#${r}${r}${g}${g}${b}${b}FF`.toUpperCase()
	}
	if (hex.length === 4) {
		const r = hex[0]
		const g = hex[1]
		const b = hex[2]
		const a = hex[3]
		return `#${r}${r}${g}${g}${b}${b}${a}${a}`.toUpperCase()
	}
	if (hex.length === 6) return `#${hex}FF`.toUpperCase()
	if (hex.length === 8) return `#${hex}`.toUpperCase()
	return null
}

const PALETTE: Record<string, Record<string, string>> = {
	slate: {
		"50": "#f8fafc",
		"100": "#f1f5f9",
		"200": "#e2e8f0",
		"300": "#cbd5e1",
		"400": "#94a3b8",
		"500": "#64748b",
		"600": "#475569",
		"700": "#334155",
		"800": "#1e293b",
		"900": "#0f172a",
		"950": "#020617",
	},
	yellow: {
		"50": "#fefce8",
		"100": "#fef9c3",
		"200": "#fef08a",
		"300": "#fde047",
		"400": "#facc15",
		"500": "#eab308",
		"600": "#ca8a04",
		"700": "#a16207",
		"800": "#854d0e",
		"900": "#713f12",
		"950": "#422006",
	},
}

const parseTailwindColor = (token: string): string | null => {
	if (!token) return null

	if (token === "white") return "#FFFFFFFF"
	if (token === "black") return "#000000FF"
	if (token === "transparent") return "#00000000"

	if (token.startsWith("[") && token.endsWith("]")) {
		const inner = token.slice(1, -1)
		return normalizeHexColor(inner)
	}

	const parts = token.split("-")
	if (parts.length < 2) return null

	const shade = parts.at(-1)
	if (!shade) return null
	const name = parts.slice(0, -1).join("-")

	const byShade = PALETTE[name]
	if (!byShade) return null
	const hex = byShade[shade]
	if (!hex) return null
	return normalizeHexColor(hex)
}

const SPACING_PX = (value: string): number | null => {
	if (!value) return null
	if (value === "px") return 1

	const n = Number(value)
	if (!Number.isFinite(n)) return null
	return n * 4
}

const TEXT_SIZES_PX: Record<string, number> = {
	xs: 12,
	sm: 14,
	base: 16,
	lg: 18,
	xl: 20,
	"2xl": 24,
	"3xl": 30,
	"4xl": 36,
	"5xl": 48,
	"6xl": 60,
	"7xl": 72,
	"8xl": 96,
	"9xl": 128,
}

const createFlatBackgroundStyleBox = (color: string) => {
	const StyleBoxFlatCtor = (globalThis as any).StyleBoxFlat
	if (!StyleBoxFlatCtor) return null

	const sb = new StyleBoxFlatCtor()
	try {
		sb.BgColor = new Color(color)
	} catch {
		// ignore
	}
	return sb
}

export const compileClassToken = (className: string): StyleObject | null => {
	if (!className) return null

	if (className === "hidden") return { visible: false }
	if (className === "block" || className === "flex" || className === "inline")
		return { visible: true }

	if (className.startsWith("opacity-")) {
		const raw = className.slice("opacity-".length)
		const pct = clamp(Number(raw), 0, 100)
		if (!Number.isFinite(pct)) return null
		const a = hexByte((pct / 100) * 255)
		return { modulate: `#FFFFFF${a}` }
	}

	if (className.startsWith("text-")) {
		const token = className.slice("text-".length)
		const size = TEXT_SIZES_PX[token]
		if (typeof size === "number") return { fontSize: size }

		const color = parseTailwindColor(token)
		if (color) return { fontColor: color }
		return null
	}

	if (className.startsWith("bg-")) {
		const token = className.slice("bg-".length)
		const color = parseTailwindColor(token)
		if (!color) return null

		const sb = createFlatBackgroundStyleBox(color)
		if (!sb) return null
		return { backgroundStyle: sb }
	}

	if (className.startsWith("p-")) {
		const px = SPACING_PX(className.slice("p-".length))
		if (px === null) return null
		return { margin: px }
	}
	if (className.startsWith("px-")) {
		const px = SPACING_PX(className.slice("px-".length))
		if (px === null) return null
		return { marginLeft: px, marginRight: px }
	}
	if (className.startsWith("py-")) {
		const px = SPACING_PX(className.slice("py-".length))
		if (px === null) return null
		return { marginTop: px, marginBottom: px }
	}
	if (className.startsWith("pt-")) {
		const px = SPACING_PX(className.slice("pt-".length))
		if (px === null) return null
		return { marginTop: px }
	}
	if (className.startsWith("pr-")) {
		const px = SPACING_PX(className.slice("pr-".length))
		if (px === null) return null
		return { marginRight: px }
	}
	if (className.startsWith("pb-")) {
		const px = SPACING_PX(className.slice("pb-".length))
		if (px === null) return null
		return { marginBottom: px }
	}
	if (className.startsWith("pl-")) {
		const px = SPACING_PX(className.slice("pl-".length))
		if (px === null) return null
		return { marginLeft: px }
	}

	if (className.startsWith("gap-")) {
		const px = SPACING_PX(className.slice("gap-".length))
		if (px === null) return null
		return { separation: px, hSeparation: px, vSeparation: px }
	}

	if (className.startsWith("z-")) {
		const z = Number(className.slice("z-".length))
		if (!Number.isFinite(z)) return null
		return { zIndex: z }
	}

	if (className === "w-full") {
		return {
			expandBehaviorH: SizeFlags.ExpandFill,
			anchorLeft: 0,
			anchorRight: 1,
			offsetLeft: 0,
			offsetRight: 0,
		}
	}
	if (className === "h-full") {
		return {
			expandBehaviorV: SizeFlags.ExpandFill,
			anchorTop: 0,
			anchorBottom: 1,
			offsetTop: 0,
			offsetBottom: 0,
		}
	}

	if (className.startsWith("w-")) {
		const px = SPACING_PX(className.slice("w-".length))
		if (px === null) return null
		return { minWidth: px }
	}
	if (className.startsWith("h-")) {
		const px = SPACING_PX(className.slice("h-".length))
		if (px === null) return null
		return { minHeight: px }
	}

	return null
}

export const initTailwind = (rootDocument: Document, initial: StyleSheet = {}) => {
	rootDocument.setStyleSheet(initial as any)

	const getClass = (className: string) => {
		if (!className) return undefined
		const existing = (initial as any)[className]
		if (existing) return existing

		const compiled = compileClassToken(className)
		if (!compiled) return undefined

		;(initial as any)[className] = compiled
		return compiled
	}

	;(globalThis as any).__twGetClass = getClass
	return initial
}

