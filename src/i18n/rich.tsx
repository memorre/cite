import * as React from "react";

/**
 * Interpolates React nodes into a translated template, e.g.
 * rich("Requires {key} to work", { key: <code>OPENAI_API_KEY</code> }).
 * Works in both Server and Client Components.
 */
export function rich(template: string, nodes: Record<string, React.ReactNode>): React.ReactNode[] {
  return template.split(/(\{\w+\})/g).map((part, index) => {
    const match = /^\{(\w+)\}$/.exec(part);
    if (match && match[1] in nodes) {
      return <React.Fragment key={index}>{nodes[match[1]]}</React.Fragment>;
    }
    return part;
  });
}
