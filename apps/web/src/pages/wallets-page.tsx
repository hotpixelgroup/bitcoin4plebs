import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Callout, RichText } from '@bitcoin4plebs/ui';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";

interface WalletType {
  name: string;
  what: string;
  bestFor: string;
  mainRisk: string;
}

const TYPES: WalletType[] = [
  {
    name: 'Custodial account (an exchange)',
    what: 'The company holds the keys; your "balance" is a row in their database, an IOU with a login screen.',
    bestFor: 'Buying in, briefly. Convenience while you learn.',
    mainRisk: 'The company itself: hacks, freezes, insolvency. Mt. Gox and FTX customers held exactly this.',
  },
  {
    name: 'Software wallet (phone or desktop)',
    what: 'An app on a networked device that generates and holds your keys. Real self-custody, connected to the world.',
    bestFor: 'Pocket money and daily spending, like the cash in your physical wallet.',
    mainRisk: 'The device is online: malware, a compromised phone, or you, typing the seed where it does not belong.',
  },
  {
    name: 'Hardware signer',
    what: 'A dedicated offline device that keeps keys off networked machines entirely and signs through a narrow, checkable channel.',
    bestFor: 'Savings. Anything that would genuinely hurt to lose.',
    mainRisk: 'Your backup discipline: the device is replaceable, the seed words are not.',
  },
  {
    name: 'Multisig (several keys required)',
    what: 'A lock needing, say, 2 of 3 keys held in different places or by different people. No single point of failure.',
    bestFor: 'Serious savings, businesses, inheritance planning. Graduate-level custody.',
    mainRisk: 'Complexity. More keys and more backups mean more procedure to get wrong; walk before running.',
  },
];

/**
 * Reference page: wallet types without brand names, ever. The site
 * compares categories and teaches evaluation, then points at neutral
 * verification resources, because recommending a vendor is exactly the
 * kind of trust this site exists to remove.
 */
export function WalletsPage() {
  useEffect(() => {
    document.title = 'Wallet types · bitcoin4plebs';
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Reference · who holds your keys?</div>
        <h1>Choosing where your keys live</h1>
        <p>
          <RichText text="Quest #14 taught the principle: coins live on the ledger, wallets hold keys, and whoever holds the keys holds the money. This page maps the four places keys can live. **No brands, ever**: this site compares categories and teaches you to evaluate, because a recommendation is a trust relationship, and removing those is the whole point." />
        </p>
      </section>

      <section className="prose">
        <h2>The four species</h2>
        <div className="contrast-wrap">
          <table className="contrast" aria-label="Wallet types compared">
            <thead>
              <tr>
                <th></th>
                <th>What it is</th>
                <th>Best for</th>
                <th>Main risk</th>
              </tr>
            </thead>
            <tbody>
              {TYPES.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>{t.what}</td>
                  <td>{t.bestFor}</td>
                  <td>{t.mainRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Match the tool to the amount</h2>
        <p>
          <RichText text="The sane pattern mirrors how you already treat cash: **pocket money** in a software wallet on your phone, **savings** behind a hardware signer, and **nothing that matters** left custodial once you know how to withdraw. Move up a tier when the balance would hurt to lose; practice each move with signet first ([Quest #11](/quests/send-your-first-play-bitcoin)) and with a small test amount on mainnet always." />
        </p>

        <h2>How to evaluate any wallet, brandlessly</h2>
        <p>
          <RichText text="Five questions do most of the work. Is it **open source**, so the code can be read rather than believed? Does it use the **standard seed phrase** (BIP-39, [Quest #14](/quests/your-keys-your-coins)) so your backup outlives the vendor? Are its builds **reproducible**, meaning independent people can verify the download matches the source? Does it let you **verify addresses on the device** rather than trusting a possibly compromised screen? And the disqualifier: does anything about it ever ask you to type an existing seed into a networked app or website? One yes to that last question ends the conversation." />
        </p>
        <p>
          <RichText text="Neutral places to check rather than trust: [WalletScrutiny](https://walletscrutiny.com/) independently tests whether wallet builds are reproducible from their source, and [bitcoin.org's wallet chooser](https://bitcoin.org/en/choose-your-wallet) filters by feature without ranking. Treat both as leads for your own verification, not verdicts." />
        </p>

        <Callout>
          <strong>The one rule that survives every choice.</strong>{' '}
          <RichText text="Whatever you pick, the seed words are generated offline, written on paper or steel, stored in more than one place, restored as a test before real funds arrive, and typed into **nothing with a network**. Every other decision on this page is recoverable; that one is not. The full discipline is [Quest #14](/quests/your-keys-your-coins)." />
        </Callout>

        <p className="cvk-next">
          <Link to="/quests/your-keys-your-coins">← Quest #14: the custody quest</Link>
          <Link to="/quests/send-your-first-play-bitcoin">Practice with play money first →</Link>
        </p>
      </section>
    </main>
  );
}
