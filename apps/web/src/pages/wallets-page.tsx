import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import { SITE } from '../lib/site';

const DEFAULT_TITLE = `${SITE.name} · ${SITE.tagline}`;

interface Species {
  id: string;
  name: string;
  sub: string;
  lives: string;
  taken: string;
  lost: string;
  good: string;
  note?: string;
}

const CUSTODIAL: Species = {
  id: 'custodial',
  name: 'Custodial account',
  sub: 'an exchange, or any app that holds it for you',
  lives: "On a company's server. Your balance is a row in their database.",
  taken: 'The company is hacked, goes under, or is told to freeze you.',
  lost: 'Almost never by forgetting. They can reset your login, and that is what you are paying for.',
  good: 'Buying in, and the first days while you learn.',
  note: 'Mt. Gox and FTX customers held exactly this.',
};

const SELF: Species[] = [
  {
    id: 'software',
    name: 'Software wallet',
    sub: 'an app on your phone or laptop',
    lives: 'On a device of yours that is online. Made there, kept there.',
    taken: 'Malware reaches that device, or anyone ever sees your words.',
    lost: 'Your backup is bad. Nobody can reset it for you.',
    good: 'Everyday spending, like the cash in your pocket.',
  },
  {
    id: 'hardware',
    name: 'Hardware signer',
    sub: 'a small device with one job',
    lives: 'Inside a device built so the key never leaves it, even while it is plugged in.',
    taken: 'Someone has the device and its PIN, or has your words.',
    lost: 'Your backup is bad. The device is replaceable, the words are not.',
    good: 'Savings. Anything that would genuinely hurt to lose.',
  },
  {
    id: 'multisig',
    name: 'Multisig',
    sub: 'several keys, kept apart',
    lives: 'Split across two or more devices in different places.',
    taken: 'Someone reaches two of your keys. One is never enough.',
    lost: 'You lose two keys, or you lose the wallet configuration.',
    good: 'Serious savings, businesses, inheritance. Walk before you run.',
  },
];

const CHECKS = [
  {
    ask: 'Can anyone read the code?',
    look: 'A public source repository you could point a programmer at, not a marketing page with a download button.',
    why: 'Open source can be checked. Closed source can only be believed.',
  },
  {
    ask: "Will your backup work in somebody else's wallet?",
    look: 'Standard seed words (BIP-39, [Quest #14](/quests/your-keys-your-coins)) **and** a standard derivation path, or a way to export the account xpub or descriptor.',
    why: 'The words restore your keys. The derivation path is what tells a new wallet where to look for your coins. A wallet that invents its own path can hand you a perfectly valid backup and an empty screen.',
  },
  {
    ask: 'Can the download be proven to match the code?',
    look: 'Reproducible builds, signed releases, and an independent result at [WalletScrutiny](https://walletscrutiny.com/).',
    why: "Readable source proves nothing if the file you installed is a different program. On Android and desktop, other people really do run this check. On iPhone, Apple's store makes it impossible for anyone, so there the honest answer is \"cannot be checked\", not \"passes\".",
  },
  {
    ask: 'Can you point it at your own node?',
    look: "A setting for your own node or server, instead of only the vendor's.",
    why: 'Otherwise a company answers "how much do I have?" on your behalf, and learns every address you own ([Quest #9](/quests/run-your-own-node), [Quest #15](/quests/who-can-see-your-money)).',
  },
  {
    ask: 'If there is a signing device, does it show the address on its own screen?',
    look: 'A confirm-on-device step showing the address and amount before you send.',
    why: "Swapping the address on your computer screen is malware's favourite trick, and a screen it cannot repaint is the answer. Software-only wallets have no second screen, so this one simply does not apply to them.",
  },
];

function SpeciesCard({ s }: { s: Species }) {
  return (
    <li className="wal-card">
      <div className="wal-card-name">{s.name}</div>
      <div className="wal-card-sub">{s.sub}</div>
      <dl className="wal-facts">
        <div className="wal-fact">
          <dt>where the key lives</dt>
          <dd>{s.lives}</dd>
        </div>
        <div className="wal-fact">
          <dt>someone takes it if</dt>
          <dd>{s.taken}</dd>
        </div>
        <div className="wal-fact">
          <dt>you lose it if</dt>
          <dd>{s.lost}</dd>
        </div>
      </dl>
      <div className="wal-card-good">
        <span className="wal-card-k">good for</span>
        {s.good}
      </div>
      {s.note && <div className="wal-card-note">{s.note}</div>}
    </li>
  );
}

/** The axis unique to this page: who is actually holding the key. */
function CustodyLine() {
  return (
    <figure className="secviz" aria-labelledby="wal-line-cap">
      <figcaption className="secviz-cap" id="wal-line-cap">
        Who is actually holding the key?
      </figcaption>
      <div className="wal-line">
        <div className="wal-side wal-side-them">
          <div className="wal-side-head">
            Someone else holds the key
            <span className="wal-side-sub">you hold a promise</span>
          </div>
          <ul className="wal-cards" role="list">
            <SpeciesCard s={CUSTODIAL} />
          </ul>
        </div>

        <div className="wal-rule">
          <span>the custody line</span>
        </div>

        <div className="wal-side wal-side-you">
          <div className="wal-side-head">
            You hold the key
            <span className="wal-side-sub">three tools, one job each</span>
          </div>
          <ul className="wal-cards wal-cards-3" role="list">
            {SELF.map((s) => (
              <SpeciesCard key={s.id} s={s} />
            ))}
          </ul>
        </div>
      </div>
      <p className="secviz-foot">
        Crossing the line is the decision. Choosing among the three on the right only changes how
        well you guard what is already yours, and you can change your mind for the price of one
        transaction.
      </p>
    </figure>
  );
}

/** Nobody ends up with one wallet: the spend pocket and the keep pocket. */
function TwoPockets() {
  return (
    <figure className="secviz" aria-labelledby="wal-pockets-cap">
      <figcaption className="secviz-cap" id="wal-pockets-cap">
        Two wallets, two jobs
      </figcaption>
      <div className="wal-pockets">
        <div className="wal-pocket wal-pocket-hot">
          <div className="wal-pocket-head">what you spend</div>
          <div className="wal-pocket-tool">a software wallet, on you</div>
          <ul>
            <li>Kept deliberately small, like the cash in your pocket</li>
            <li>Online, convenient, and the one you actually use</li>
            <li>Stolen or infected, this costs you a night out</li>
          </ul>
        </div>
        <div className="wal-pocket-move" aria-hidden="true">
          <span>top up, rarely</span>
        </div>
        <div className="wal-pocket wal-pocket-cold">
          <div className="wal-pocket-head">what you keep</div>
          <div className="wal-pocket-tool">a hardware signer, or multisig</div>
          <ul>
            <li>Boring by design, touched a few times a year</li>
            <li>The keys never meet a networked machine</li>
            <li>This is the one whose recovery you rehearse</li>
          </ul>
        </div>
      </div>
      <p className="secviz-foot">
        The split is the whole point. Money moves from what you keep to what you spend, in small
        amounts, on purpose. It should almost never move the other way in a hurry.
      </p>
    </figure>
  );
}

/** Five questions a reader can actually run against a wallet, plus the gate. */
function WalletChecks() {
  return (
    <figure className="secviz" aria-labelledby="wal-checks-cap">
      <figcaption className="secviz-cap" id="wal-checks-cap">
        Five questions, then one dealbreaker
      </figcaption>
      <ol className="wal-checks">
        {CHECKS.map((c, i) => (
          <li className="wal-check" key={c.ask}>
            <span className="wal-check-n" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="wal-check-body">
              <div className="wal-check-ask">{c.ask}</div>
              <div className="wal-check-look">
                <span className="wal-check-k">look for</span>
                <RichText text={c.look} />
              </div>
              <div className="wal-check-why">
                <RichText text={c.why} />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="wal-gate">
        <div className="wal-gate-head">the dealbreaker · one yes ends it</div>
        <div className="wal-gate-q">Is something asking you for seed words you already have?</div>
        <p className="wal-gate-why">
          <RichText text="Restoring your own backup into a wallet you chose and installed is normal, and it is how recovery works. What is never normal is a website, a support agent, a giveaway, or a 'validation' step asking for words that already exist. Nothing legitimate needs them. That question has one safe answer and it is to walk away." />
        </p>
      </div>
    </figure>
  );
}

/**
 * Reference page: where keys can live, and how to judge a wallet yourself.
 * Brandless by design; the site compares categories and teaches evaluation,
 * because a recommendation is a trust relationship and removing those is
 * the whole point.
 */
export function WalletsPage() {
  useEffect(() => {
    document.title = `Wallet types · ${SITE.name}`;
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
          <RichText text="Quest #14 taught the principle: coins live on the ledger, wallets hold keys, and whoever holds the keys holds the money. This page maps the four answers to one question, **who can move your money**. **No brands, ever**: this site compares categories and teaches you to evaluate, because a recommendation is a trust relationship, and removing those is the whole point." />
        </p>
      </section>

      <section className="prose">
        <div className="sec-block">
          <h2>One real decision, then a tool for the job</h2>
          <p>
            <RichText text="There are four common arrangements, but they are not four equal options. One of them puts a company between you and your money. The other three are three ways of doing the same correct thing, chosen to fit the job." />
          </p>
          <CustodyLine />
          <p>
            <RichText text="Two things the cards cannot tell you by looking. First, app stores are full of apps that look exactly like a software wallet and are really the first card. The test is simple: did it show you words that you wrote down, and will those words restore your money in a *different* wallet? If there is a balance, a password-reset link, and no words, then someone else holds the key. Second, a signing device is only yours from the moment you generate its seed on it. Buy direct from the maker, and treat a device that arrives with a recovery phrase already filled in as exactly what it is, a trap." />
          </p>
        </div>

        <div className="sec-block">
          <h2>You will end up running two</h2>
          <p>
            <RichText text="Almost nobody settles on a single wallet, and you should not plan to. The arrangement people land on mirrors what you already do with cash: a small amount on you, and the rest somewhere duller and better guarded." />
          </p>
          <TwoPockets />
          <p>
            <RichText text="How much belongs in each is a question of stakes, answered on the [security page](/security), which is also where you will find how to actually run whichever you pick. Rehearse any new setup with worthless practice coins first ([Quest #11](/quests/send-your-first-play-bitcoin)) where your wallet supports signet, and make the first send to a new wallet a small real test amount, always." />
          </p>
        </div>

        <div className="sec-block">
          <h2>How to judge any wallet yourself</h2>
          <p>
            <RichText text="You will never need a recommendation if you can run these yourself. Open the wallet's own site in another tab and work down the list. The first four apply to anything; the fifth applies only where there is a separate signing device." />
          </p>
          <WalletChecks />
          <p>
            <RichText text="Two neutral places to check rather than trust. [WalletScrutiny](https://walletscrutiny.com/) examines whether a wallet is what it claims to be, including whether its build can be reproduced from its source and whether it really holds your keys at all. [bitcoin.org's wallet chooser](https://bitcoin.org/en/choose-your-wallet) rates wallets against a published checklist, so read its reasons rather than its verdicts. Treat both as leads for your own checking, not as answers." />
          </p>
        </div>

        <Callout>
          <strong>The one rule that survives every choice.</strong>{' '}
          <RichText text="Whatever you pick, the seed words are generated offline, written on paper or steel, stored in more than one place, restored as a test before real funds arrive, and typed into **nothing with a network**. Two mistakes on this page cannot be undone: leaving coins with a company that fails, and losing your backup. Everything else is a transaction away from being fixed. The full discipline is the [security playbook](/security)." />
        </Callout>

        <p className="cvk-next">
          <Link to="/quests/your-keys-your-coins">← Quest #14: the custody quest</Link>
          <Link to="/security">How to keep it safe →</Link>
        </p>
      </section>
    </main>
  );
}
