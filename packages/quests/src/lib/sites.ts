/**
 * The two front doors.
 *
 * bitcoin4plebs and lightning4plebs are ONE codebase and one engine,
 * published as two GitHub Pages sites from the same source. A build-time
 * flag (VITE_SITE) picks which curriculum, brand and home page to render.
 *
 * Everything site-specific that isn't a quest lives here, as plain
 * serializable data — same rule as quests themselves, so a component never
 * has to know which site it is running inside.
 */

/** Which site a piece of content belongs to. */
export type SiteId = 'bitcoin' | 'lightning';

/** Every site id, for tests and exhaustive iteration. */
export const SITE_IDS: readonly SiteId[] = ['bitcoin', 'lightning'];

export interface SiteConfig {
  id: SiteId;
  /** GitHub repo the site is published from — also its Pages base path. */
  repo: string;
  /** Wordmark, split so the "4" can carry the accent colour. */
  brand: { pre: string; accent: string; post: string };
  /** Full wordmark as plain text, for titles and manifests. */
  name: string;
  tagline: string;
  description: string;
  /** The home-page hero. */
  hero: { kicker: string; title: string; blurb: string };
  /** The header's "source pinned:" label. */
  pinLabel: string;
  /** The footer's one-line description, after the wordmark. */
  footerLine: string;
  /** Attribution for the quoted source excerpts. */
  footerCredit: string;
  /** One-line subtitles for each curriculum track on the home page. */
  trackBlurbs: Record<string, string>;
  /**
   * Which brandless reference pages this front door offers. Routes and nav
   * links are both driven from this, so a page written for one site never
   * appears, half-relevant, on the other.
   */
  referencePages: readonly string[];
  /**
   * The other front door. Cross-linked from the home page, the navigation
   * and the footer — a reader who lands on the wrong one of the two should
   * never have to guess that the other exists.
   */
  sibling: {
    id: SiteId;
    name: string;
    url: string;
    /** Short positional label, e.g. "the layer above". */
    label: string;
    /** The invitation shown on the home page. */
    blurb: string;
    /** What the sibling covers, as three short phrases. */
    covers: readonly string[];
  };
  /** Canonical URL where this front door is published. */
  url: string;
  /** Alt text for the social card, describing what the image shows. */
  ogImageAlt: string;
  /**
   * The running story that threads through this site's curriculum: one
   * payment followed from the first quest to the last. Each front door
   * follows its own.
   */
  story: { label: string; cast: [string, string] };
  /** Brand accent, mirrored by the --brand token in the stylesheet. */
  accent: string;
  /**
   * The self-issued diploma. `claim` carries a {n} placeholder for the
   * curriculum length; the footnote is the site's three signature facts.
   */
  diploma: { claim: string; claim2: string; footnote: string };
}

const BITCOIN_URL = 'https://hotpixelgroup.github.io/bitcoin4plebs/';
const LIGHTNING_URL = 'https://hotpixelgroup.github.io/lightning4plebs/';

export const sites: Record<SiteId, SiteConfig> = {
  bitcoin: {
    id: 'bitcoin',
    repo: 'bitcoin4plebs',
    brand: { pre: 'bitcoin', accent: '4', post: 'plebs' },
    name: 'bitcoin4plebs',
    tagline: "don't trust. verify.",
    description:
      "Don't trust. Verify. Understand Bitcoin's code, no engineering degree required.",
    hero: {
      kicker: "Don't trust. Verify.",
      title: "Understand Bitcoin's code. No engineering degree required.",
      blurb:
        "Millions of people hold bitcoin on the word of engineers they've never met. You don't have to. Each **verification quest** below walks you through the **real Bitcoin Core source code**. The code is pinned, annotated in plain English, and runnable, so you can see for yourself what's true.",
    },
    url: BITCOIN_URL,
    ogImageAlt:
      "bitcoin4plebs: Understand Bitcoin's code. No engineering degree required. A real excerpt from validation.cpp with the halving line highlighted.",
    pinLabel: 'bitcoin/bitcoin',
    footerLine: "understand Bitcoin's code without taking anyone's word for it",
    footerCredit: 'Source excerpts © Bitcoin Core developers, MIT License.',
    trackBlurbs: {
      'Start here':
        'Five minutes of mental model. No code and no jargon: what a ledger is, and why copies plus rules changed everything.',
      Foundations:
        'The rulebook, one page at a time: where the money comes from, why yours is yours, and who enforces it all.',
      Advanced: 'Leave the classroom: real artifacts, real byte order, and finally a node of your own.',
      'Zoom out':
        'From the code to the network: the incentive machine that keeps it all usable with nobody in charge, and the fight over what a ledger is for.',
      'Take it home':
        'The last mile: what a wallet actually stores, what the 12 words really are, the habits that keep coins safe, and who can see what on a glass ledger.',
      'Beyond the chain':
        'The doorway: how a thousand payments fit into two transactions, read from the Lightning specs — and where to go next if you want the whole system.',
      'The big questions':
        'The two things everyone asks first and can only truly answer last: why is this money at all, and does it waste energy? Both answered from the ground up.',
    },
    referencePages: ['/core-vs-knots', '/wallets', '/security'],
    sibling: {
      id: 'lightning',
      name: 'lightning4plebs',
      url: LIGHTNING_URL,
      label: 'the layer above',
      blurb:
        "Ready for the layer above? Lightning gets the same treatment there: its own specifications quoted verbatim, a real node's source beside them, and cryptography you can check against the spec's own published test vectors.",
      covers: [
        'channels, and why cheating costs everything',
        'what is really inside an lnbc invoice',
        'payments that cross strangers who never learn who you are',
      ],
    },
    story: { label: 'ana pays bo', cast: ['A', 'B'] },
    accent: '#f7931a',
    diploma: {
      claim:
        'read the real Bitcoin Core source, ran the real arithmetic, and verified all {n} quests',
      claim2: "with their own eyes, taking nobody's word for any of it",
      footnote: '21,000,000 never · 20,999,999.9769 forever · 000000000019d668…',
    },
  },

  lightning: {
    id: 'lightning',
    repo: 'lightning4plebs',
    brand: { pre: 'lightning', accent: '4', post: 'plebs' },
    name: 'lightning4plebs',
    tagline: "don't trust. verify.",
    description:
      "Don't trust. Verify. Understand the Lightning Network from its own specifications.",
    hero: {
      kicker: "Don't trust. Verify.",
      title: 'Understand Lightning. From the specification, not the marketing.',
      blurb:
        "Lightning is explained to newcomers almost entirely in metaphors, and the metaphors are where the misunderstandings live. Each **verification quest** below reads the **actual Lightning specifications** — the BOLTs — alongside the code of a node that implements them. Better still: the specs ship their own test vectors, so the tools on this site aren't asking for your trust. They're graded by the spec itself, in public, on every change.",
    },
    url: LIGHTNING_URL,
    ogImageAlt:
      'lightning4plebs: Understand Lightning from its specifications. A real excerpt from BOLT #3 with the revocation branch highlighted.',
    pinLabel: 'lightning/bolts',
    footerLine: 'understand Lightning from its specifications, not from metaphors',
    footerCredit:
      'Specification excerpts © the Lightning RFC authors, CC-BY 4.0. Node source © the LND authors, MIT License.',
    trackBlurbs: {
      'The channel':
        'Two people, one shared lock, and a balance the blockchain never sees. The foundation everything else is built on.',
      'Money in motion':
        'The object you actually paste. What is inside an lnbc string, and why the hash at its centre is the best payment receipt in ordinary use.',
      Routing:
        'From a private tab to a network of strangers: how a payment crosses people who can neither steal it nor learn who you are.',
      'The big questions':
        'The one that decides whether any of the above is yours: who is holding the key, what it costs to hold it yourself, and an honest scorecard with the weaknesses left in.',
    },
    // Lightning's own reference pages (node software, liquidity, custody)
    // are not written yet; the nav simply does not offer them.
    referencePages: [],
    sibling: {
      id: 'bitcoin',
      name: 'bitcoin4plebs',
      url: BITCOIN_URL,
      label: 'the layer underneath',
      blurb:
        'Everything here rests on the chain underneath: the 2-of-2 output is an ordinary Bitcoin output, and the penalty branch is ordinary Bitcoin script. If the base layer is still a mystery, start there — same approach, real source code.',
      covers: [
        'why the 21 million cap is arithmetic, not a promise',
        'what a private key actually locks',
        'the block space auction Lightning exists to avoid',
      ],
    },
    story: { label: 'tomas buys coffee', cast: ['T', 'M'] },
    accent: '#8b5cf6',
    diploma: {
      claim:
        'read the Lightning specifications, reproduced their own test vectors, and verified all {n} quests',
      claim2: "with their own eyes, taking nobody's word for any of it",
      footnote: '1,366 bytes, always · 2-of-2 or nothing · old states are radioactive',
    },
  },
};

/** Narrow an arbitrary string (an env var) to a site id, defaulting to bitcoin. */
export function resolveSite(value: string | undefined): SiteId {
  return value === 'lightning' ? 'lightning' : 'bitcoin';
}
