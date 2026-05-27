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

export function HighlightedText({
  text,
  normativeHighlight,
}: {
  text: string;
  normativeHighlight: boolean;
}) {
  const chunks = text.split(normativeHighlight ? fullHighlightPattern : commandHighlightPattern);
  return (
    <>
      {chunks.map((chunk, index) =>
        normativeHighlight && normativePattern.test(chunk) ? (
          <mark className="normative-term" key={`${chunk}-${index}`}>
            {chunk}
          </mark>
        ) : commandOnlyPattern.test(chunk) ? (
          <code className="command-term" key={`${chunk}-${index}`}>
            {chunk}
          </code>
        ) : (
          <span key={`${chunk}-${index}`}>{chunk}</span>
        ),
      )}
    </>
  );
}
