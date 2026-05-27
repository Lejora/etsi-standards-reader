import type { ReactNode } from "react";
import type { SearchFilters } from "./types";

const commandTerms = [
  "DISPLAY TEXT",
  "GET INKEY",
  "GET INPUT",
  "MORE TIME",
  "PLAY TONE",
  "POLL INTERVAL",
  "REFRESH",
  "SET UP MENU",
  "SELECT ITEM",
  "SEND SHORT MESSAGE",
  "SEND SS",
  "SEND USSD",
  "SET UP CALL",
  "POLLING OFF",
  "PROVIDE LOCAL INFORMATION",
  "SET UP EVENT LIST",
  "PERFORM CARD APDU",
  "POWER OFF CARD",
  "POWER ON CARD",
  "GET READER STATUS",
  "TIMER MANAGEMENT",
];

function escapePattern(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const commandPattern = commandTerms
  .sort((left, right) => right.length - left.length)
  .map((term) => term.split(" ").map(escapePattern).join("[ _]+"))
  .join("|");

const commandHighlightPattern = new RegExp(`\\b(${commandPattern})\\b`, "gi");
const fullHighlightPattern = new RegExp(`\\b(shall not|shall|should|may|${commandPattern})\\b`, "gi");
const normativePattern = /^(shall not|shall|should|may)$/i;
const commandOnlyPattern = new RegExp(`^(?:${commandPattern})$`, "i");

function createSearchPattern(searchQuery: string, searchFilters: SearchFilters) {
  const query = searchQuery.trim();
  if (!query) return null;
  const terms = searchFilters.mode === "all" ? query.split(/\s+/).filter(Boolean) : [query];
  const pattern = terms.sort((left, right) => right.length - left.length).map(escapePattern).join("|");
  const boundary = searchFilters.wholeWord ? "\\b" : "";
  return new RegExp(`(${boundary}(?:${pattern})${boundary})`, searchFilters.matchCase ? "g" : "gi");
}

function applySearchHighlight(text: string, pattern: RegExp | null, keyPrefix: string): ReactNode {
  if (!pattern) return text;
  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? (
      <mark className="search-term" key={`${keyPrefix}-search-${index}`}>
        {part}
      </mark>
    ) : (
      <span key={`${keyPrefix}-text-${index}`}>{part}</span>
    ),
  );
}

export function HighlightedText({
  text,
  normativeHighlight,
  searchQuery = "",
  searchFilters,
  semanticHighlight = true,
}: {
  text: string;
  normativeHighlight: boolean;
  searchQuery?: string;
  searchFilters?: SearchFilters;
  semanticHighlight?: boolean;
}) {
  const searchPattern = searchFilters ? createSearchPattern(searchQuery, searchFilters) : null;
  const chunks = semanticHighlight ? text.split(normativeHighlight ? fullHighlightPattern : commandHighlightPattern) : [text];
  return (
    <>
      {chunks.map((chunk, index) => {
        const content = applySearchHighlight(chunk, searchPattern, `${chunk}-${index}`);
        return normativeHighlight && semanticHighlight && normativePattern.test(chunk) ? (
          <mark className="normative-term" key={`${chunk}-${index}`}>
            {content}
          </mark>
        ) : semanticHighlight && commandOnlyPattern.test(chunk) ? (
          <code className="command-term" key={`${chunk}-${index}`}>
            {content}
          </code>
        ) : (
          <span key={`${chunk}-${index}`}>{content}</span>
        );
      })}
    </>
  );
}
