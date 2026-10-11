import { cn } from "@/lib/utils";

/**
 * Cite's app icon, identical to its project card on yetao.org: a rounded-square blue gradient
 * tile with a white stroked document glyph.
 */
export function AppIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-grid shrink-0 place-items-center text-white", className)}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        background: "linear-gradient(145deg, #5ac8fa 0%, #0071e3 100%)",
        boxShadow:
          size >= 48
            ? "0 6px 16px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.25)"
            : "0 1px 3px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.25)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.5}
        height={size * 0.5}
        fill="none"
        stroke="currentColor"
        strokeWidth={size >= 48 ? 1.8 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    </span>
  );
}
