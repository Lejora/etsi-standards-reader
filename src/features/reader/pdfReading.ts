import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { ContentsRange, OutlineItem, ReadingBlock, TextLine } from "./types";

function pageLines(items: Array<{ str: string; transform: number[] }>): TextLine[] {
  const rows = new Map<number, { words: string[]; size: number }>();
  for (const item of items) {
    const row = Math.round(item.transform[5]);
    const current = rows.get(row) ?? { words: [], size: 0 };
    current.words.push(item.str);
    current.size = Math.max(current.size, Math.abs(item.transform[0]));
    rows.set(row, current);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, row]) => ({
      text: row.words.join(" ").replace(/\s+/g, " ").trim(),
      size: row.size,
    }))
    .filter((line) => Boolean(line.text));
}

function cleanReadingLines(lines: TextLine[]) {
  return lines.filter(
    (line) =>
      line.text !== "ETSI" &&
      !/^ETSI TS \d/.test(line.text) &&
      !(/^\d+$/.test(line.text) && line.size <= 9.5) &&
      !/^Release \d+$/.test(line.text),
  );
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function extractPlainLines(pdf: PDFDocumentProxy, pageNumber: number) {
  const text = await (await pdf.getPage(pageNumber)).getTextContent();
  const items = text.items
    .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item)
    .map((item) => ({ str: item.str, transform: item.transform }));
  return pageLines(items).map((line) => line.text);
}

function titleNeedle(title: string) {
  return normalizeText(title)
    .replace(/\.+\s*\d+$/g, "")
    .replace(/^\d+(?:\.\d+)*\s+/, "")
    .toLowerCase();
}

function isContentsLikePage(lines: string[], outline: OutlineItem[]) {
  const pageText = normalizeText(lines.join(" ")).toLowerCase();
  const hasContentsHeading = lines.some((line) => /^contents$/i.test(line));
  const dottedLeaderLines = lines.filter((line) => /\.{5,}\s*\d+\s*$/.test(line)).length;
  const outlineMatches = outline.filter((item) => {
    const needle = titleNeedle(item.title);
    return needle.length >= 8 && pageText.includes(needle);
  }).length;
  const pageNumberTailLines = lines.filter((line) => /\b\d{1,3}\s*$/.test(line)).length;

  return (
    hasContentsHeading ||
    dottedLeaderLines >= 3 ||
    (dottedLeaderLines >= 1 && outlineMatches >= 3) ||
    (outlineMatches >= 6 && pageNumberTailLines >= 6)
  );
}

export function buildReadingBlocks(lines: TextLine[], pageOutline: OutlineItem[], title: string) {
  const blocks: ReadingBlock[] = [];
  let paragraph = "";
  let listItems: string[] = [];
  let listItem = "";
  let inList = false;

  function flushParagraph() {
    if (!paragraph) return;
    blocks.push({
      type: "paragraph",
      text: paragraph,
      emphasis: /^(NOTE|EXAMPLE|RECOMMENDATION)\b/i.test(paragraph) ? "note" : "normal",
    });
    paragraph = "";
  }

  function flushListItem() {
    if (!listItem) return;
    listItems.push(listItem);
    listItem = "";
  }

  function flushList() {
    flushListItem();
    if (!listItems.length) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
    inList = false;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines[index + 1];
    const combined = next ? normalizeText(`${line.text} ${next.text}`) : line.text;
    const outlineHeading =
      pageOutline.find((item) => normalizeText(item.title) === line.text) ??
      pageOutline.find((item) => normalizeText(item.title) === combined);

    if (outlineHeading || line.size >= 13) {
      let headingText = outlineHeading?.title ?? line.text;
      if (outlineHeading && normalizeText(outlineHeading.title) === combined) {
        index += 1;
      } else if (!outlineHeading && /^\d+(?:\.\d+)+$/.test(line.text) && next?.size >= 13) {
        headingText = `${line.text} ${next.text}`;
        index += 1;
      }
      flushParagraph();
      flushList();
      if (normalizeText(headingText) !== normalizeText(title)) {
        blocks.push({
          type: "heading",
          level: outlineHeading?.level ?? Math.min(4, headingText.split(".").length),
          text: headingText,
        });
      }
      continue;
    }

    if (line.text === "•" || line.text === "-" || line.text === "\u2022") {
      flushParagraph();
      flushListItem();
      inList = true;
      continue;
    }

    if (inList && (listItem || lines[index - 1]?.text === "•")) {
      listItem = normalizeText(`${listItem} ${line.text}`);
      if (/[.;:]$/.test(line.text)) flushListItem();
      continue;
    }

    if (inList) flushList();
    paragraph = normalizeText(`${paragraph} ${line.text}`);
    if (/[.!?;:]$/.test(line.text)) flushParagraph();
  }
  flushParagraph();
  flushList();
  return blocks;
}

export async function resolveOutline(pdf: PDFDocumentProxy): Promise<OutlineItem[]> {
  const outline = (await pdf.getOutline()) ?? [];
  const resolved: OutlineItem[] = [];
  async function visit(items: typeof outline, level: number) {
    for (const item of items) {
      let page = 1;
      if (item.dest) {
        const destination =
          typeof item.dest === "string"
            ? await pdf.getDestination(item.dest)
            : item.dest;
        if (destination) page = (await pdf.getPageIndex(destination[0])) + 1;
      }
      resolved.push({ title: item.title, level, page });
      if (item.items.length) await visit(item.items, level + 1);
    }
  }
  await visit(outline, 1);
  return resolved;
}

export async function resolveContentsRange(
  pdf: PDFDocumentProxy,
  outline: OutlineItem[],
): Promise<ContentsRange | null> {
  if (!outline.length) return null;

  const scanLimit = Math.min(pdf.numPages, 30);
  let start: number | null = null;
  let end: number | null = null;

  for (let pageNumber = 1; pageNumber <= scanLimit; pageNumber += 1) {
    const lines = await extractPlainLines(pdf, pageNumber);
    const looksLikeContents = isContentsLikePage(lines, outline);

    if (looksLikeContents) {
      start ??= pageNumber;
      end = pageNumber;
      continue;
    }

    if (start !== null) {
      break;
    }
  }

  return start !== null && end !== null ? { start, end } : null;
}

export async function extractLines(page: PDFPageProxy) {
  const textContent = await page.getTextContent();
  const items = textContent.items
    .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item)
    .map((item) => ({ str: item.str, transform: item.transform }));
  return cleanReadingLines(pageLines(items));
}
