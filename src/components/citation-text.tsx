import * as React from "react";

/**
 * Renders answer text with its inline [n] source markers as small superscript pills.
 * `label` is a template such as "Source {index}", used for the marker's accessible name.
 * Has no hooks, so it works in Server and Client Components alike.
 */
export function CitationText({ text, label, className }: { text: string; label: string; className?: string }) {
  const parts = text.split(/(\[\d{1,2}\])/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const match = /^\[(\d{1,2})\]$/.exec(part);
        if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;
        return (
          <React.Fragment key={i}>
            <sup
              aria-hidden="true"
              className="mx-[1px] inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary-soft px-1 text-[10px] font-semibold leading-none tracking-normal text-link"
            >
              {match[1]}
            </sup>
            <span className="sr-only"> ({label.replace("{index}", match[1])})</span>
          </React.Fragment>
        );
      })}
    </span>
  );
}
