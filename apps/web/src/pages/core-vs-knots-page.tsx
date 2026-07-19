import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Callout, RichText } from '@bitcoin4plebs/ui';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";

interface CompareRow {
  aspect: string;
  core: string;
  knots: string;
}

const ROWS: CompareRow[] = [
  {
    aspect: 'Consensus rules',
    core: 'Identical. Both enforce the same rules and follow the same chain.',
    knots: 'Identical. A block valid to one is valid to the other.',
  },
  {
    aspect: 'Who maintains it',
    core: 'Hundreds of contributors; changes merge only after public review by a small set of maintainers.',
    knots: 'One primary maintainer, Luke Dashjr, rebasing a long-running patch set onto each Core release.',
  },
  {
    aspect: 'Release rhythm',
    core: 'Major releases roughly twice a year, long deprecation cycles.',
    knots: 'Tracks Core releases, usually shortly after each one.',
  },
  {
    aspect: 'Default OP_RETURN budget',
    core: '100,000 vbytes since v30 (October 2025): effectively open.',
    knots: 'Strict small budget; data-carrier filtering on by default.',
  },
  {
    aspect: 'Data filtering',
    core: 'Minimal by default; the historic knobs survive but are de-emphasized.',
    knots: 'Extensive: OP_RETURN limits, inscription-style filtering, bare multisig off, more knobs.',
  },
  {
    aspect: 'Stated philosophy',
    core: 'If consensus will confirm it anyway, relay it; prunable OP_RETURN data beats UTXO-set poison.',
    knots: 'A node should spend its bandwidth on payments, not billboards; filters express values even when they leak.',
  },
  {
    aspect: 'What neither can do',
    core: 'Change consensus by shipping a release.',
    knots: 'Same. Filters shape relay, never the chain.',
  },
];

/**
 * Reference page: the two node implementations most plebs actually choose
 * between, what they are, how they differ, and how to think about the
 * choice. Every hard claim links to a primary source or a quest.
 */
export function CoreVsKnotsPage() {
  useEffect(() => {
    document.title = 'Core vs. Knots · bitcoin4plebs';
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Reference · choose your gatekeeper</div>
        <h1>Bitcoin Core vs. Bitcoin Knots</h1>
        <p>
          Two programs, one chain. Both are full Bitcoin nodes: they speak the same network
          protocol, enforce the same consensus rules, and follow the same history, letter for
          letter. What differs is <strong>relay policy</strong> (what each will pass along while it
          waits) and <strong>governance</strong> (who writes the software and how). Understanding
          that difference is most of understanding the loudest fight in Bitcoin today.
        </p>
      </section>

      <section className="prose">
        <h2>What a node implementation even is</h2>
        <p>
          <RichText text="Bitcoin is not a program; it's a set of rules that many programs agree to enforce. A **node implementation** is any software that speaks the peer-to-peer protocol, checks every block and transaction against consensus (Quests #1 through #7), keeps a queue of waiting transactions under its own policy (Quest #12), and answers your wallet's questions. The chain cannot see which one you run, and that's the point: the rules are the standard, the software is just your enforcement agent. Anyone can write one; most people choose between these two." />
        </p>

        <h2>Bitcoin Core</h2>
        <p>
          <RichText text="[Bitcoin Core](https://github.com/bitcoin/bitcoin) is the direct descendant of the client Satoshi published in 2009 and the de-facto reference implementation: when this site quotes 'the Bitcoin source,' it quotes Core at a pinned commit. Development happens in public, with hundreds of contributors, adversarial review, and a small set of maintainers who merge only what survives it. Its consensus code is famously conservative. Its **relay defaults** are where 2025's controversy lives: version 30 (October 2025) raised the default OP_RETURN allowance from 83 bytes to 100,000 vbytes, the exact line you can read at policy.h:84 in [Quest #13](/quests/the-data-wars), reasoning that the old filter had failed and prunable data is less harmful than UTXO-set tricks." />
        </p>

        <h2>Bitcoin Knots</h2>
        <p>
          <RichText text="[Bitcoin Knots](https://github.com/bitcoinknots/bitcoin) is a derivative of Core maintained by Luke Dashjr, one of Bitcoin's earliest and longest-serving developers. Each release takes Core and applies a long-running patch set: stricter data-carrier defaults, additional spam and inscription filters, bare-multisig relay off, and extra configuration switches Core declines to ship. It is best understood as **Core plus an opinion**: the consensus engine is the same; the taste layer is much stricter. Its governance is the mirror image of Core's: one primary maintainer gives it coherence and speed, at the cost of a far smaller review pool, a trade-off you should weigh honestly in both directions." />
        </p>

        <h2>Side by side</h2>
        <div className="contrast-wrap">
          <table className="contrast" aria-label="Bitcoin Core versus Bitcoin Knots comparison">
            <thead>
              <tr>
                <th></th>
                <th>Bitcoin Core</th>
                <th>Bitcoin Knots</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.aspect}>
                  <td>{row.aspect}</td>
                  <td>{row.core}</td>
                  <td>{row.knots}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>The 2025 split, and what it proved</h2>
        <p>
          <RichText text="When Core v30 opened the OP_RETURN default, operators who wanted filtering didn't file complaints; they **switched software**. Public node crawlers watched Knots grow from a rounding error at the start of 2025 to a clearly double-digit share of reachable nodes within the year. Check the live number yourself rather than trusting this paragraph. [bitnodes.io](https://bitnodes.io/nodes/all/) breaks reachable nodes down by user agent, and [Luke Dashjr's charts](https://luke.dashjr.org/programs/bitcoin/files/charts/software.html) track the same split with different methodology. (Crawlers only see *listening* nodes, so every such number is an estimate of a subset.) This is the implementation market from [Quest #12](/quests/who-keeps-bitcoin-usable) operating in daylight: defaults are proposals, and node operators are the electorate." />
        </p>
        <p>
          <RichText text="It also proved the limits of the vote. Knots nodes filter what they relay, yet the data still reaches miners by other paths and still confirms, because **policy shapes your bandwidth while consensus shapes the chain** (Quest #13's finale lets you feel this yourself). That leak is why some filtering advocates now back [BIP-110](/quests/the-data-wars), which would move data limits into consensus, where they'd bind everyone or no one." />
        </p>

        <h2>So which should you run?</h2>
        <p>
          <RichText text="Both give you the thing that matters: **full validation with your own eyes**, the sovereignty Quest #9 is about. Beyond that: run **Core** if you want the implementation with the deepest review coverage and you're content to let the fee auction judge what fills blocks. Run **Knots** if you want your node's bandwidth to express a view about what the ledger is for, and you accept a smaller review pool as the price of that voice. Run either over neither: a pleb with a filtering node and a pleb with an open one have far more in common with each other than with someone trusting an exchange's word. And nothing here is a marriage; switching costs an evening." />
        </p>

        <Callout>
          <strong>Don't trust this page either.</strong>{' '}
          <RichText text="It's a summary, and summaries are where errors hide. Primary sources: [Core's repository](https://github.com/bitcoin/bitcoin) and [release notes](https://bitcoincore.org/en/releases/), [Knots' repository](https://github.com/bitcoinknots/bitcoin) and [site](https://bitcoinknots.org/), the pinned policy code quoted verbatim in [Quest #13](/quests/the-data-wars), and the live crawler numbers linked above. If this page and a primary source ever disagree, the primary source is right and we'd like an [issue](https://github.com/hotpixelgroup/bitcoin4plebs/issues/new/choose)." />
        </Callout>

        <p className="cvk-next">
          <Link to="/quests/who-keeps-bitcoin-usable">← Quest #12: the machine these two live in</Link>
          <Link to="/quests/the-data-wars">Quest #13: the fight they're having →</Link>
        </p>
      </section>
    </main>
  );
}
