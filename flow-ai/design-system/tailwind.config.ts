/**
 * Flow AI Design System — Tailwind Config
 * 이 파일은 design-tokens/ JSON 파일을 Tailwind CSS에 연결합니다.
 * apps/front/tailwind.config.ts 에서 이 파일을 extend하거나 직접 사용하세요.
 */

import type { Config } from "tailwindcss";

import colors from "./design-tokens/colors.json";
import typography from "./design-tokens/typography.json";
import spacing from "./design-tokens/spacing.json";
import shadows from "./design-tokens/shadows.json";
import motion from "./design-tokens/motion.json";
import zIndex from "./design-tokens/z-index.json";
import border from "./design-tokens/border.json";
import radix from "./design-tokens/radix-colors.json";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // ── Colors ──────────────────────────────────────────────
      colors: {
        brand: colors.brand,
        "flow-bg": colors["flow-bg"],
        gray: colors.gray,
        project: colors.project,
        semantic: {
          success: colors.semantic.success,
          danger: colors.semantic.danger,
          warning: colors.semantic.warning,
          info: colors.semantic.info,
          link: colors.semantic.link,
          neutral: colors.semantic.neutral,
        },
        // Radix Colours — 풀 스케일 (1-12)
        // 사용법: className="bg-radix-jade-3 text-radix-jade-11"
        radix: {
          red:    radix.red,
          pink:   radix.pink,
          purple: radix.purple,
          jade:   radix.jade,
          teal:   radix.teal,
          cyan:   radix.cyan,
          sky:    radix.sky,
          mint:   radix.mint,
          grass:  radix.grass,
        },
      },

      // CSS 변수 기반 theme 색상 (shadcn/ui 호환)
      backgroundColor: {
        background: "hsl(var(--background))",
        card: "hsl(var(--card))",
        popover: "hsl(var(--popover))",
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        muted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))",
      },

      // ── Typography ──────────────────────────────────────────
      fontFamily: {
        sans: typography.fontFamily.sans,
        mono: typography.fontFamily.mono,
        ios: typography.fontFamily.ios,
      },
      fontSize: typography.fontSize as Config["theme"]["fontSize"],

      // ── Spacing ─────────────────────────────────────────────
      spacing: spacing.spacing as Config["theme"]["spacing"],
      borderRadius: {
        none: `${spacing.borderRadius.none}px`,
        sm: `${spacing.borderRadius.sm}px`,
        DEFAULT: `${spacing.borderRadius.DEFAULT}px`,
        md: `${spacing.borderRadius.md}px`,
        lg: `${spacing.borderRadius.lg}px`,
        xl: `${spacing.borderRadius.xl}px`,
        "2xl": `${spacing.borderRadius["2xl"]}px`,
        "3xl": `${spacing.borderRadius["3xl"]}px`,
        full: `${spacing.borderRadius.full}px`,
      },

      // ── Shadows ─────────────────────────────────────────────
      boxShadow: shadows.shadows,

      // ── Motion ──────────────────────────────────────────────
      transitionDuration: {
        instant: `${motion.duration.instant}ms`,
        fast: `${motion.duration.fast}ms`,
        normal: `${motion.duration.normal}ms`,
        slow: `${motion.duration.slow}ms`,
        slower: `${motion.duration.slower}ms`,
        slowest: `${motion.duration.slowest}ms`,
      },
      transitionTimingFunction: motion.easing,
      keyframes: {
        fadeIn:   { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeOut:  { from: { opacity: "1" }, to: { opacity: "0" } },
        slideUp:  { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideDown:{ from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn:  { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        scaleOut: { from: { opacity: "1", transform: "scale(1)" }, to: { opacity: "0", transform: "scale(0.95)" } },
        shimmer:  { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
      },
      animation: {
        "fade-in":   "fadeIn 150ms ease-out",
        "fade-out":  "fadeOut 100ms ease-in",
        "slide-up":  "slideUp 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-down":"slideDown 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "scale-in":  "scaleIn 150ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "scale-out": "scaleOut 100ms ease-in",
        "shimmer":   "shimmer 1.5s ease-in-out infinite",
      },

      // ── Z-index ─────────────────────────────────────────────
      zIndex: {
        hide:     String(zIndex.zIndex.hide),
        base:     String(zIndex.zIndex.base),
        raised:   String(zIndex.zIndex.raised),
        dropdown: String(zIndex.zIndex.dropdown),
        sticky:   String(zIndex.zIndex.sticky),
        overlay:  String(zIndex.zIndex.overlay),
        modal:    String(zIndex.zIndex.modal),
        popover:  String(zIndex.zIndex.popover),
        toast:    String(zIndex.zIndex.toast),
        tooltip:  String(zIndex.zIndex.tooltip),
        max:      String(zIndex.zIndex.max),
      },

      // ── Border ──────────────────────────────────────────────
      borderWidth: border.borderWidth,
      opacity: Object.fromEntries(
        Object.entries(border.opacity).map(([k, v]) => [k, String(v)])
      ),

      // ── Screens (Breakpoints) ────────────────────────────────
      screens: border.screens,
    },
  },
  plugins: [],
};

export default config;
