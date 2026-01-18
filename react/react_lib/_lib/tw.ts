import { SizeFlags, StretchModeEnum } from "gd"

type StyleObject = Record<string, any>
type StyleSheet = Record<string, StyleObject>

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const parseFraction = (token: string): number | null => {
	if (!token) return null
	const parts = token.split("/")
	if (parts.length !== 2) return null

	const num = Number(parts[0])
	const den = Number(parts[1])
	if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null

	return num / den
}

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

const parseArbitraryPx = (token: string): number | null => {
	if (!token) return null
	if (!token.startsWith("[") || !token.endsWith("]")) return null

	const inner = token.slice(1, -1).trim()
	const px = inner.endsWith("px") ? inner.slice(0, -2) : inner
	const n = Number(px)
	if (!Number.isFinite(n)) return null
	return n
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

	const slashIndex = token.lastIndexOf("/")
	if (slashIndex > 0) {
		const baseToken = token.slice(0, slashIndex)
		const alphaToken = token.slice(slashIndex + 1)
		const pct = Number(alphaToken)
		if (!Number.isFinite(pct)) return null

		const base = parseTailwindColor(baseToken)
		if (!base) return null

		const a = hexByte((clamp(pct, 0, 100) / 100) * 255)
		return base.length === 9 ? `${base.slice(0, 7)}${a}` : base
	}

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

const parseSpacingPx = (token: string): number | null => {
	if (!token) return null
	if (token.startsWith("[") && token.endsWith("]")) return parseArbitraryPx(token)
	return SPACING_PX(token)
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

	const negative = className.startsWith("-")
	if (negative) className = className.slice(1)

	if (className === "hidden") return { visible: false }
	if (className === "block" || className === "flex" || className === "inline")
		return { visible: true }

	if (className === "grow")
		return { expandBehaviorH: SizeFlags.ExpandFill, expandBehaviorV: SizeFlags.ExpandFill }
	if (className === "grow-x") return { expandBehaviorH: SizeFlags.ExpandFill }
	if (className === "grow-y") return { expandBehaviorV: SizeFlags.ExpandFill }

	if (className === "shrink")
		return {
			expandBehaviorH: SizeFlags.ShrinkBegin,
			expandBehaviorV: SizeFlags.ShrinkBegin,
		}
	if (className === "shrink-x") return { expandBehaviorH: SizeFlags.ShrinkBegin }
	if (className === "shrink-y") return { expandBehaviorV: SizeFlags.ShrinkBegin }
	if (className === "shrink-begin")
		return {
			expandBehaviorH: SizeFlags.ShrinkBegin,
			expandBehaviorV: SizeFlags.ShrinkBegin,
		}
	if (className === "shrink-center")
		return {
			expandBehaviorH: SizeFlags.ShrinkCenter,
			expandBehaviorV: SizeFlags.ShrinkCenter,
		}
	if (className === "shrink-end")
		return {
			expandBehaviorH: SizeFlags.ShrinkEnd,
			expandBehaviorV: SizeFlags.ShrinkEnd,
		}

	if (className === "fill")
		return { expandBehaviorH: SizeFlags.Fill, expandBehaviorV: SizeFlags.Fill }
	if (className === "fill-x") return { expandBehaviorH: SizeFlags.Fill }
	if (className === "fill-y") return { expandBehaviorV: SizeFlags.Fill }

	if (className === "expand")
		return { expandBehaviorH: SizeFlags.Expand, expandBehaviorV: SizeFlags.Expand }
	if (className === "expand-x") return { expandBehaviorH: SizeFlags.Expand }
	if (className === "expand-y") return { expandBehaviorV: SizeFlags.Expand }

	if (className === "expand-fill")
		return { expandBehaviorH: SizeFlags.ExpandFill, expandBehaviorV: SizeFlags.ExpandFill }
	if (className === "expand-fill-x") return { expandBehaviorH: SizeFlags.ExpandFill }
	if (className === "expand-fill-y") return { expandBehaviorV: SizeFlags.ExpandFill }

	if (className === "absolute") return { position: "absolute" }
	if (className === "relative") return { position: "relative" }

	if (className === "object-cover")
		return { stretchMode: StretchModeEnum.KeepAspectCovered }
	if (className === "object-contain")
		return { stretchMode: StretchModeEnum.KeepAspectCentered }
	if (className === "object-fill")
		return { stretchMode: StretchModeEnum.Scale }
	if (className === "object-none")
		return { stretchMode: StretchModeEnum.KeepCentered }

	if (className === "flex") return { display: "flex" }
	if (className === "flex-row") return { flexDirection: "row" }
	if (className === "flex-col") return { flexDirection: "column" }

	if (className.startsWith("justify-")) {
		const token = className.slice("justify-".length)
		if (token === "start") return { justifyContent: "start" }
		if (token === "center") return { justifyContent: "center" }
		if (token === "end") return { justifyContent: "end" }
		if (token === "between") return { justifyContent: "between" }
		return null
	}

	if (className.startsWith("items-")) {
		const token = className.slice("items-".length)
		if (token === "start") return { alignItems: "start" }
		if (token === "center") return { alignItems: "center" }
		if (token === "end") return { alignItems: "end" }
		if (token === "stretch") return { alignItems: "stretch" }
		return null
	}

	if (className === "overflow-hidden") return { clipContents: true }
	if (className === "overflow-visible") return { clipContents: false }

	if (className.startsWith("inset-x-")) {
		const px = parseSpacingPx(className.slice("inset-x-".length))
		if (px === null) return null
		const v = negative ? -px : px
		return { left: v, right: v }
	}
	if (className.startsWith("inset-y-")) {
		const px = parseSpacingPx(className.slice("inset-y-".length))
		if (px === null) return null
		const v = negative ? -px : px
		return { top: v, bottom: v }
	}
	if (className.startsWith("inset-")) {
		const px = parseSpacingPx(className.slice("inset-".length))
		if (px === null) return null
		const v = negative ? -px : px
		return { top: v, right: v, bottom: v, left: v }
	}
	if (className.startsWith("top-")) {
		const px = parseSpacingPx(className.slice("top-".length))
		if (px === null) return null
		return { top: negative ? -px : px }
	}
	if (className.startsWith("right-")) {
		const px = parseSpacingPx(className.slice("right-".length))
		if (px === null) return null
		return { right: negative ? -px : px }
	}
	if (className.startsWith("bottom-")) {
		const px = parseSpacingPx(className.slice("bottom-".length))
		if (px === null) return null
		return { bottom: negative ? -px : px }
	}
	if (className.startsWith("left-")) {
		const px = parseSpacingPx(className.slice("left-".length))
		if (px === null) return null
		return { left: negative ? -px : px }
	}

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
		if (color) return { bgColor: color }
		return null
	}

	if (className.startsWith("p-")) {
		const px = SPACING_PX(className.slice("p-".length))
		if (px === null) return null
		return { padding: px }
	}
	if (className.startsWith("px-")) {
		const px = SPACING_PX(className.slice("px-".length))
		if (px === null) return null
		return { paddingLeft: px, paddingRight: px }
	}
	if (className.startsWith("py-")) {
		const px = SPACING_PX(className.slice("py-".length))
		if (px === null) return null
		return { paddingTop: px, paddingBottom: px }
	}
	if (className.startsWith("pt-")) {
		const px = SPACING_PX(className.slice("pt-".length))
		if (px === null) return null
		return { paddingTop: px }
	}
	if (className.startsWith("pr-")) {
		const px = SPACING_PX(className.slice("pr-".length))
		if (px === null) return null
		return { paddingRight: px }
	}
	if (className.startsWith("pb-")) {
		const px = SPACING_PX(className.slice("pb-".length))
		if (px === null) return null
		return { paddingBottom: px }
	}
	if (className.startsWith("pl-")) {
		const px = SPACING_PX(className.slice("pl-".length))
		if (px === null) return null
		return { paddingLeft: px }
	}

	if (className === "rounded") return { cornerRadius: 4 }
	if (className.startsWith("rounded-")) {
		const token = className.slice("rounded-".length)
		if (token === "none") return { cornerRadius: 0 }
		if (token === "sm") return { cornerRadius: 2 }
		if (token === "md") return { cornerRadius: 6 }
		if (token === "lg") return { cornerRadius: 8 }
		if (token === "xl") return { cornerRadius: 12 }
		if (token === "2xl") return { cornerRadius: 16 }
		if (token === "3xl") return { cornerRadius: 24 }
		if (token === "full") return { cornerRadius: 9999 }

		if (token.startsWith("[") && token.endsWith("]")) {
			const inner = token.slice(1, -1).trim()
			const px = inner.endsWith("px") ? Number(inner.slice(0, -2)) : Number(inner)
			if (!Number.isFinite(px)) return null
			return { cornerRadius: px }
		}
		return null
	}

	if (className === "border") return { borderWidth: 1 }
	if (className.startsWith("border-")) {
		const token = className.slice("border-".length)

		if (token.startsWith("[") && token.endsWith("]")) {
			const inner = token.slice(1, -1).trim()
			const px = inner.endsWith("px") ? Number(inner.slice(0, -2)) : Number(inner)
			if (!Number.isFinite(px)) return null
			return { borderWidth: px }
		}

		const n = Number(token)
		if (Number.isFinite(n)) return { borderWidth: n }

		const color = parseTailwindColor(token)
		if (color) return { borderColor: color }
		return null
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
		const token = className.slice("w-".length)
		const frac = parseFraction(token)
		if (frac !== null) {
			return { expandBehaviorH: SizeFlags.ExpandFill, stretchRatioH: frac }
		}
		const px = token.startsWith("[") ? parseArbitraryPx(token) : SPACING_PX(token)
		if (px === null) return null
		return { minWidth: px }
	}
	if (className.startsWith("h-")) {
		const token = className.slice("h-".length)
		const frac = parseFraction(token)
		if (frac !== null) {
			return { expandBehaviorV: SizeFlags.ExpandFill, stretchRatioV: frac }
		}
		const px = token.startsWith("[") ? parseArbitraryPx(token) : SPACING_PX(token)
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
