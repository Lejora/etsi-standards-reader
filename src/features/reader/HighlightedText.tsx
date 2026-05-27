import type { ReactNode } from "react";
import type { SearchFilters } from "./types";

const commandTerms = [
  // Basic proactive UICC / CAT commands
  "DISPLAY TEXT",
  "GET INKEY",
  "GET INPUT",
  "MORE TIME",
  "PLAY TONE",
  "POLL INTERVAL",
  "REFRESH",
  "SET UP MENU",
  "SET-UP MENU",
  "SELECT ITEM",
  "SEND SHORT MESSAGE",
  "SEND SM",
  "SEND SMS",
  "SEND SS",
  "SEND USSD",
  "SET UP CALL",
  "POLLING OFF",
  "PROVIDE LOCAL INFORMATION",
  "SET UP EVENT LIST",

  // Multiple card / reader related
  "PERFORM CARD APDU",
  "POWER OFF CARD",
  "POWER ON CARD",
  "GET READER STATUS",

  // Timer / idle / AT / language / browser
  "TIMER MANAGEMENT",
  "SET UP IDLE MODE TEXT",
  "RUN AT COMMAND",
  "SEND DTMF",
  "SEND DTMF COMMAND",
  "LANGUAGE NOTIFICATION",
  "LAUNCH BROWSER",

  // Bearer Independent Protocol / BIP
  "OPEN CHANNEL",
  "CLOSE CHANNEL",
  "RECEIVE DATA",
  "SEND DATA",
  "GET CHANNEL STATUS",
  "SERVICE SEARCH",
  "GET SERVICE INFORMATION",
  "DECLARE SERVICE",

  // Frames / display layout
  "SET FRAMES",
  "GET FRAME STATUS",
  "GET FRAMES STATUS",

  // Multimedia / MMS
  "RETRIEVE MULTIMEDIA MESSAGE",
  "SUBMIT MULTIMEDIA MESSAGE",
  "DISPLAY MULTIMEDIA MESSAGE",

  // Location / activation / contactless
  "GEOGRAPHICAL LOCATION REQUEST",
  "ACTIVATE",
  "CONTACTLESS STATE CHANGED",

  // eCAT / encapsulation / LSI
  "COMMAND CONTAINER",
  "ENCAPSULATED SESSION CONTROL",
  "LSI COMMAND",

  // CAT / USAT related terminal-to-UICC commands and procedures
  // 厳密には proactive command ではないけど、ETSI CAT 文書上で command description として出るもの
  "PROFILE DOWNLOAD",
  "TERMINAL PROFILE",
  "TERMINAL RESPONSE",
  "FETCH",
  "ENVELOPE",
  "EVENT DOWNLOAD",
  "MENU SELECTION",
  "COMMAND RESULT",

  // Specific ENVELOPE command names / variants
  "ENVELOPE CALL CONTROL",
  "ENVELOPE(CALL CONTROL)",
  "ENVELOPE (CALL CONTROL)",
  "ENVELOPE TIMER EXPIRATION",
  "ENVELOPE(TIMER EXPIRATION)",
  "ENVELOPE (TIMER EXPIRATION)",
  "ENVELOPE TERMINAL APPLICATIONS",
  "ENVELOPE(TERMINAL APPLICATIONS)",
  "ENVELOPE (TERMINAL APPLICATIONS)",
  "ENVELOPE ENVELOPE CONTAINER",
  "ENVELOPE(ENVELOPE CONTAINER)",
  "ENVELOPE (ENVELOPE CONTAINER)",
  "ENVELOPE SERVICE LIST",
  "ENVELOPE(SERVICE LIST)",
  "ENVELOPE (SERVICE LIST)",

  // Download / control command names often appearing in CAT/USAT sections
  "SMS-PP DOWNLOAD",
  "SMS PP DOWNLOAD",
  "CELL BROADCAST DOWNLOAD",
  "MMS NOTIFICATION DOWNLOAD",
  "MMS TRANSFER STATUS",
  "MO SHORT MESSAGE CONTROL",
  "CALL CONTROL",
  "GEOGRAPHICAL LOCATION REPORTING",
];

function escapePattern(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const commandPattern = commandTerms
  .sort((left, right) => right.length - left.length)
  .map((term) => term.split(" ").map(escapePattern).join("[ _]+"))
  .join("|");

const normativeTokenPattern = "[Ss][Hh][Aa][Ll][Ll](?: [Nn][Oo][Tt])?|[Ss][Hh][Oo][Uu][Ll][Dd]|[Mm][Aa][Yy]";
const commandHighlightPattern = new RegExp(`\\b(${commandPattern})\\b`, "g");
const fullHighlightPattern = new RegExp(`\\b(${normativeTokenPattern}|${commandPattern})\\b`, "g");
const normativePattern = /^(shall not|shall|should|may)$/i;
const commandOnlyPattern = new RegExp(`^(?:${commandPattern})$`);

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
