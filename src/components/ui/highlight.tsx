import React from "react";

interface HighlightProps {
  text: string;
  query: string;
}

export function Highlight({ text, query }: HighlightProps) {
  if (!query) return <>{text}</>;

  // Safely escape special characters in the query for the regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[#34A853]/20 text-[#34A853] px-0.5 rounded-sm font-bold bg-transparent"
            style={{ backgroundColor: "rgba(52, 168, 83, 0.2)" }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
