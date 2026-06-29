// Type declarations for @greymoth/cjk-agent-fixtures.

export type Script =
  | "JP"
  | "KO"
  | "ZH"
  | "AR"
  | "HE"
  | "EN"
  | "Latin"
  | "combining"
  | "emoji";

export type Direction = "ltr" | "rtl";

export type SliceUnit = "byte" | "utf16" | "grapheme";

export interface CaseBase {
  /** Failure mode number, 1..11, matching taxonomy.json. */
  mode: number;
  /** Failure mode slug, matching taxonomy.json. */
  slug: string;
  /** Script or category the input exercises. */
  script: Script;
}

export interface WidthCase extends CaseBase {
  input: string;
  /** Column width a correct East Asian Width counter returns. */
  correctWidth: number;
  /** Width a one-column-per-character counter returns. */
  naiveWidth: number;
}

export interface EqualityCase extends CaseBase {
  a: string;
  b: string;
  /** a === b. */
  rawEqual: boolean;
  /** Equal after canonical (NFC) normalization. */
  nfcEqual: boolean;
  /** Equal after compatibility (NFKC) folding. */
  nfkcEqual: boolean;
}

export interface DirectionCase extends CaseBase {
  input: string;
  /** Base direction per the Unicode Bidi Algorithm (P2/P3). */
  correctDir: Direction;
  /** Direction guessed from the first code point only. */
  naiveFirstCharDir: Direction;
}

export interface WhitespaceCase extends CaseBase {
  input: string;
  correctTrimmed: string;
  correctBlank: boolean;
  asciiTrimmed: string;
  asciiBlank: boolean;
}

export interface SliceCase extends CaseBase {
  input: string;
  unit: SliceUnit;
  /** Offset, in `unit`s, that lands inside a character or cluster. */
  limit: number;
  /** Result of cutting at `limit` in `unit` granularity (corrupted). */
  torn: string;
  /** Result of cutting at the next coarser granularity (intact). */
  whole: string;
}

export type EditorEvent =
  | { type: "compositionStart" }
  | { type: "compositionUpdate"; data: string }
  | { type: "compositionEnd"; data: string }
  | { type: "keydown"; key: string; composing?: boolean }
  | { type: "blur" }
  | { type: "focus" };

export interface EditorState {
  value: string;
  submitted: number;
}

export interface EditorCase extends CaseBase {
  events: EditorEvent[];
  /** Final state a correct IME-aware input reaches. */
  correct: EditorState;
  /** Bug name that, when enabled, produces the wrong final state. */
  brokenBug: string;
  /** Final state the broken input reaches. */
  broken: EditorState;
}

export const widthCases: WidthCase[];
export const equalityCases: EqualityCase[];
export const directionCases: DirectionCase[];
export const whitespaceCases: WhitespaceCase[];
export const sliceCases: SliceCase[];
export const editorCases: EditorCase[];

export const cases: {
  width: WidthCase[];
  equality: EqualityCase[];
  direction: DirectionCase[];
  whitespace: WhitespaceCase[];
  slice: SliceCase[];
  editor: EditorCase[];
};

export const allCases: CaseBase[];

/** A minimal IME-aware text input model. */
export interface Editor {
  value: string;
  composing: boolean;
  composingData: string;
  submitted: number;
  keydown(key: string, isComposing?: boolean): void;
  compositionStart(): void;
  compositionUpdate(data: string): void;
  compositionEnd(data: string): void;
  blur(): void;
  focus(): void;
}

/** Build the reference editor. Pass bug names to construct a broken one. */
export function createEditor(opts?: { bugs?: string[] }): Editor;

/** Replay an event list against an editor (or any object with the same methods). */
export function applyEvents<T>(editor: T, events: EditorEvent[]): T;

// #3 column width.
export function charWidth(codePoint: number): number;
export function displayWidth(str: string): number;
export function naiveWidth(str: string): number;

// #2 byte-boundary slicing.
export function byteSlice(str: string, nBytes: number): string;
export function codePointSlice(str: string, nChars: number): string;
export function hasReplacementChar(str: string): boolean;
export function isCleanUtf8(str: string): boolean;

// #8 UTF-16 surrogate slicing.
export function utf16Slice(str: string, nUnits: number): string;
export function utf16Length(str: string): number;
export function codePointLength(str: string): number;
export function isWellFormed(str: string): boolean;

// #10 grapheme clusters.
export function graphemes(str: string): string[];
export function graphemeLength(str: string): number;
export function graphemeSlice(str: string, n: number): string;

// #7 NFC/NFD and #9 NFKC.
export function nfc(s: string): string;
export function nfd(s: string): string;
export function nfkc(s: string): string;
/** Raw a === b. */
export function rawEqual(a: string, b: string): boolean;
/** Equal after canonical (NFC) normalization. */
export function nfcEqual(a: string, b: string): boolean;
/** Equal after compatibility (NFKC) folding. */
export function nfkcEqual(a: string, b: string): boolean;

// #6 bidi base direction.
export function baseDirection(str: string): Direction;
export function naiveDirection(str: string): Direction;

// #11 fullwidth-space trim.
export function asciiTrim(s: string): string;
export function unicodeTrim(s: string): string;
export function isBlankAscii(s: string): boolean;
export function isBlankUnicode(s: string): boolean;
