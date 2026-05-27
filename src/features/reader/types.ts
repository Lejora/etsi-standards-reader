export type ViewMode = "reading" | "original";
export type ColorTheme = "forest" | "ocean" | "mono";
export type SidePanel = "search" | "notes";
export type PageDirection = "next" | "previous";
export type AppMode = "home" | "reader" | "search" | "settings";
export type SearchMode = "contains" | "all" | "phrase";

export interface OutlineItem {
  title: string;
  level: number;
  page: number;
}

export interface IndexedPage {
  page: number;
  text: string;
}

export interface SearchHit {
  page: number;
  snippet: string;
  matchCount: number;
}

export interface SearchFilters {
  mode: SearchMode;
  matchCase: boolean;
  wholeWord: boolean;
  pageFrom: string;
  pageTo: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

export interface ReadingHeading {
  type: "heading";
  level: number;
  text: string;
}

export interface ReadingParagraph {
  type: "paragraph";
  text: string;
  emphasis: "normal" | "note";
}

export interface ReadingList {
  type: "list";
  items: string[];
}

export type ReadingBlock = ReadingHeading | ReadingParagraph | ReadingList;

export interface TextLine {
  text: string;
  size: number;
}

export interface ContentsRange {
  start: number;
  end: number;
}
