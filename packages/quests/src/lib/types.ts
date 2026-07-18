/**
 * The quest content model.
 *
 * Design rule: a Quest is PLAIN, SERIALIZABLE DATA — no components, no
 * functions. That keeps quests renderable by one generic engine today and
 * loadable from our own API tomorrow without changing a single component.
 *
 * Prose strings support a tiny inline markup (rendered by the ui RichText
 * component): **bold**, *emphasis*, `code`, and [label](https://url).
 */

/** Which repo + commit a quest's excerpts are pinned to. */
export interface SourcePin {
  /** e.g. "bitcoin/bitcoin" */
  repo: string;
  /** Full commit hash every excerpt is verbatim-copied from. */
  commit: string;
}

/** A reference to exact lines in a pinned source file. */
export interface SourceRef {
  /** Repo-relative path, e.g. "src/validation.cpp". */
  file: string;
  startLine: number;
  endLine: number;
}

/** One line of a code excerpt, kept verbatim from the source. */
export interface CodeLine {
  /** Real line number in the source file. */
  n: number;
  /** Verbatim source text (leading whitespace preserved). */
  text: string;
  /** Visually emphasize this line as the one to look at. */
  highlight?: boolean;
}

/** A verbatim code excerpt with provenance. */
export interface CodeExcerpt {
  ref: SourceRef;
  language: 'cpp' | 'ts';
  lines: CodeLine[];
}

/** A line-by-line plain-English annotation. */
export interface Annotation {
  /** Label shown in the gutter, e.g. "L1848" or "L1850–51". */
  lines: string;
  /** Rich-text explanation. */
  text: string;
}

/** One stop on a quest: prose on the left, real code on the right. */
export interface Stop {
  id: string;
  title: string;
  /** The one-line takeaway (always visible — depth level 1). */
  takeaway: string;
  /** Paragraphs for the curious (depth level 2). */
  prose: string[];
  /** Line-by-line annotations (depth level 3). */
  annotations?: Annotation[];
  /** Open the annotations panel by default. */
  annotationsOpen?: boolean;
  excerpt: CodeExcerpt;
  /**
   * Optional inline interactive figure rendered below the stop, looked up
   * in the app's viz registry (mirrors Finale.runnerId). Quests stay
   * serializable data.
   */
  viz?: string;
}

/**
 * The interactive "run it yourself" ending of a quest. `runnerId` is looked
 * up in the app's runner registry — quest data itself stays serializable.
 */
export interface Finale {
  title: string;
  takeaway: string;
  /** Key into the runner registry, e.g. "emission-schedule". */
  runnerId: string;
  /** Optional excerpt shown beside the runner (e.g. the JS translation). */
  translation?: CodeExcerpt;
  /** Fine print under the run button. */
  note?: string;
}

/** One "what you just verified" recap item. */
export interface RecapItem {
  text: string;
  /** Short source citation, e.g. "validation.cpp:1846". */
  cite?: string;
}

export interface Quest {
  /** Stable id, e.g. "quest-01". */
  id: string;
  /** URL slug, e.g. "verify-the-21-million-cap". */
  slug: string;
  number: number;
  /** Small label above the title, e.g. "Don't trust. Verify." */
  kicker: string;
  /**
   * Curriculum track this quest belongs to, e.g. "Foundations" or
   * "Advanced". Consecutive quests sharing a track are grouped together
   * on the home page. Untracked quests fall into "Foundations".
   */
  track?: string;
  title: string;
  /** Short description for the home-page card. */
  summary: string;
  /** Estimated read, e.g. "10 min". */
  duration: string;
  pin: SourcePin;
  intro: string[];
  /** The bordered promise box under the intro. */
  promise: string;
  stops: Stop[];
  finale?: Finale;
  recap: {
    items: RecapItem[];
    closing: string;
  };
}

/** Build a "verify on GitHub" URL for an excerpt at a quest's pinned commit. */
export function verifyUrl(pin: SourcePin, ref: SourceRef): string {
  return `https://github.com/${pin.repo}/blob/${pin.commit}/${ref.file}#L${ref.startLine}-L${ref.endLine}`;
}
