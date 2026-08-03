import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Callout, RichText } from '@bitcoin4plebs/ui';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";

interface Tier {
  level: number;
  amount: string;
  setup: string;
  why: string;
}

const LADDER: Tier[] = [
  {
    level: 1,
    amount: 'Pocket money',
    setup: 'A reputable open-source phone wallet',
    why: 'Convenient, always with you. Fine to risk, like cash in a wallet.',
  },
  {
    level: 2,
    amount: 'Savings',
    setup: 'One hardware signer, seed on steel',
    why: 'Keys never touch a networked machine. One good backup covers it.',
  },
  {
    level: 3,
    amount: 'Life savings',
    setup: 'Multisig: 2 of 3 keys, kept apart',
    why: 'No single point of failure. A thief needs two; you can lose one and recover.',
  },
  {
    level: 4,
    amount: 'Generational',
    setup: 'Multisig plus an inheritance plan',
    why: 'Someone you trust can recover it if you cannot, without holding keys today.',
  },
];

const RULES: Array<{ do: string; never: string }> = [
  {
    do: 'Generate the seed offline, on a dedicated device.',
    never: 'Never generate or type a real seed in a browser or a networked app (this site included).',
  },
  {
    do: 'Write the words on paper, then stamp them into steel.',
    never: 'Never photograph them, cloud-sync them, email them, or store them in a notes or password app.',
  },
  {
    do: 'Keep backups in two or more separate places.',
    never: 'Never keep your only copy in one spot a single fire or flood could take.',
  },
  {
    do: 'Do a test restore before you send real funds.',
    never: 'Never assume a backup works until you have rebuilt the wallet from it.',
  },
  {
    do: 'Verify every receive address on the device screen.',
    never: 'Never trust an address shown only on a computer that could be infected.',
  },
  {
    do: 'Send a small test amount first, always.',
    never: 'Never move a large sum as your very first transaction to a new setup.',
  },
];

/** The stakes ladder: effort should scale with what is at risk. */
function StakesLadder() {
  return (
    <div className="tiers" role="list" aria-label="Security setup by amount at stake">
      {LADDER.map((t) => (
        <div className="tier" role="listitem" key={t.level}>
          <div className="tier-meter" aria-label={`Security level ${t.level} of 4`}>
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`tier-bar ${n <= t.level ? 'tier-bar-on' : ''}`} />
            ))}
          </div>
          <div className="tier-body">
            <div className="tier-amount">{t.amount}</div>
            <div className="tier-setup">{t.setup}</div>
            <div className="tier-why">{t.why}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Where a seed phrase actually comes from, left to right. */
function EntropyFlow() {
  return (
    <figure className="secviz" aria-label="How a seed phrase is generated">
      <figcaption className="secviz-cap">From randomness to a wallet</figcaption>
      <div className="flow">
        <div className="flow-step flow-you">
          <div className="flow-icon" aria-hidden="true">⚄</div>
          <div className="flow-name">Real randomness</div>
          <div className="flow-note">dice, coin flips, or the device</div>
        </div>
        <div className="flow-arrow" aria-hidden="true">→</div>
        <div className="flow-step">
          <div className="flow-icon" aria-hidden="true">101</div>
          <div className="flow-name">128 or 256 bits</div>
          <div className="flow-note">one enormous number</div>
        </div>
        <div className="flow-arrow" aria-hidden="true">→</div>
        <div className="flow-step">
          <div className="flow-icon" aria-hidden="true">§</div>
          <div className="flow-name">12 or 24 words</div>
          <div className="flow-note">the number, spelled out</div>
        </div>
        <div className="flow-arrow" aria-hidden="true">→</div>
        <div className="flow-step flow-out">
          <div className="flow-icon" aria-hidden="true">🔑</div>
          <div className="flow-name">Every key, forever</div>
          <div className="flow-note">all your addresses derive from it</div>
        </div>
      </div>
      <p className="secviz-foot">
        The strength lives in step one. Choose the words yourself and you have replaced randomness
        with something a computer can guess.
      </p>
    </figure>
  );
}

/** What a good backup looks like, and what it must never touch. */
function BackupMap() {
  return (
    <figure className="secviz" aria-label="What a good backup looks like">
      <figcaption className="secviz-cap">Two places, no screens</figcaption>
      <div className="backup-map">
        <div className="backup-loc">
          <div className="backup-loc-head">Location 1 · home</div>
          <ul>
            <li>Steel plate with your words</li>
            <li>Multisig? the wallet config too</li>
          </ul>
        </div>
        <div className="backup-loc">
          <div className="backup-loc-head">Location 2 · elsewhere</div>
          <ul>
            <li>A second steel copy</li>
            <li>Far enough that one fire cannot reach both</li>
          </ul>
        </div>
        <div className="backup-never">
          <div className="backup-never-head">Never anywhere near it</div>
          <div className="backup-never-items">
            {['photo', 'cloud drive', 'email', 'notes app', 'password manager', 'any website'].map(
              (x) => (
                <span className="backup-x" key={x}>
                  {x}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}

/** 2 of 3 multisig, shown by what happens in each scenario. */
function MultisigDiagram() {
  return (
    <figure className="secviz" aria-label="How 2 of 3 multisig behaves">
      <figcaption className="secviz-cap">2 of 3: any two keys can spend, one key never can</figcaption>
      <div className="msig-keys">
        <div className="msig-key">
          <span className="msig-key-icon" aria-hidden="true">🔑</span> Key A<span className="msig-key-where">home</span>
        </div>
        <div className="msig-key">
          <span className="msig-key-icon" aria-hidden="true">🔑</span> Key B<span className="msig-key-where">offsite</span>
        </div>
        <div className="msig-key">
          <span className="msig-key-icon" aria-hidden="true">🔑</span> Key C<span className="msig-key-where">helper service</span>
        </div>
      </div>
      <div className="msig-cases">
        <div className="msig-case msig-good">
          <span className="msig-verdict">safe</span>
          <span className="msig-text">
            A thief steals <strong>one</strong> key. They still cannot move a satoshi.
          </span>
        </div>
        <div className="msig-case msig-good">
          <span className="msig-verdict">safe</span>
          <span className="msig-text">
            You lose <strong>one</strong> key to fire or failure. The other two recover everything.
          </span>
        </div>
        <div className="msig-case msig-spend">
          <span className="msig-verdict">spends</span>
          <span className="msig-text">
            You use <strong>any two</strong> together. That, and only that, moves the money.
          </span>
        </div>
      </div>
      <p className="secviz-foot">
        Single-key custody makes you pick which disaster to fear, theft or loss. This answers both.
      </p>
    </figure>
  );
}

/**
 * Reference page: the practical security playbook. Distinct from Quest #14
 * (the lesson) and /wallets (which type to pick), this is the how-to for
 * generation, entropy, backups, multisig, and day-to-day opsec, in the
 * plainest language possible, with a diagram per hard idea.
 */
export function SecurityPage() {
  useEffect(() => {
    document.title = 'Wallet security · bitcoin4plebs';
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Reference · guard one secret</div>
        <h1>Keep your bitcoin safe</h1>
        <p>
          <RichText text="Here is the whole job in one sentence: you are guarding **one secret** (your seed words), and everything below is just how to guard it well. No jargon, no brands, no fear. Read top to bottom the first time; come back to the checklist forever. The *why* behind all of it is [Quest #14](/quests/your-keys-your-coins)." />
        </p>
      </section>

      <section className="prose">
        <div className="sec-block">
          <h2>First: how safe do you actually need to be?</h2>
          <p>
            <RichText text="Security is a dial, not a switch. Guarding a coffee fund like a gold vault will just make you never use it. Guarding your life savings like pocket money is how people get hurt. Match the effort to the stakes, exactly as you already do with cash." />
          </p>
          <StakesLadder />
          <p>
            <RichText text="Pick your rung, then climb one step at a time. Every move up should be rehearsed with worthless practice coins first ([Quest #11 · signet](/quests/send-your-first-play-bitcoin)), and with a tiny test amount on real Bitcoin always. Choosing *where* the keys live is the [wallets page](/wallets); this page is how to run whichever you pick, safely." />
          </p>
        </div>

        <div className="sec-block">
          <h2>Generate your keys with real randomness</h2>
          <p>
            <RichText text="Your seed words are one enormous random number in disguise (you saw the recipe in [Quest #14](/quests/your-keys-your-coins)). Its whole strength is that number being **truly random**, so nobody can ever guess it. This is called **entropy**, and it is the one place where doing it yourself, wrong, can quietly ruin everything." />
          </p>
          <EntropyFlow />
          <p>
            <RichText text="Two mistakes destroy the randomness, and both are common. The first is inventing your own 'clever' phrase: a favourite quote, a birthday, a pattern. Software that turns text into a key is called a **brain wallet**, and wallets built that way get emptied within minutes by bots that try every phrase humans think of. Never choose your own words; let real randomness choose them. The second is trusting a black box: a wallet generates a seed, and you have no way to know its randomness was real." />
          </p>
          <p>
            <RichText text="The verify-don't-trust answer is to **add your own randomness**. Good hardware wallets let you roll dice or flip a coin and feed the results in, and the device still computes the checksum so the phrase stays valid. Now the randomness is partly yours, and you never had to trust the machine's hidden dice. Twelve words is already 128 bits, which is 2^128 possible phrases: a **39-digit number**, and you can feel exactly how hopeless guessing it is in [Quest #3's finale](/quests/what-stops-someone-spending-your-coins). **24 words (256 bits)** is the belt-and-braces maximum the standard allows." />
          </p>
          <div className="sec-incident">
            <div className="sec-incident-date">Disclosed 30 July 2026 · a real case, not a hypothetical</div>
            <p>
              <RichText text="Block's security researchers found that **COLDCARD** firmware had been generating seeds with a *deterministic* fallback routine (`ngu.random` falling back to MicroPython's Yasmarang) instead of the chip's hardware random number generator. It drew on the microcontroller's ID and timing values, neither of which is unpredictable, so seeds could be rebuilt offline and matched against the chain. Around **1,367 BTC, about $88.6 million, left 4,585 addresses**, with the first wave draining 1,083 BTC in 41 minutes. Galaxy Research and Chainalysis consider the theft *likely linked* to the flaw; as of writing that link is investigative rather than proven." />
            </p>
            <p>
              <RichText text="**If you hold one:** affected builds are Mk2 and Mk3 on 4.0.1 through 4.1.9, Mk4 and Mk5 before 5.6.0, and Q before 1.5.0Q (or the matching Edge releases). Updating firmware is **not enough on its own**, because a seed born from a weak generator stays guessable forever. The fix is to update, generate a **brand-new seed**, verify a receive address on the device screen, send a small test, migrate everything across, and keep the old backup until that migration confirms." />
            </p>
            <p>
              <RichText text="Read the failure, because it is the whole argument of this section: every other layer held. The cryptography was sound, the words were standard, the device was purpose-built and offline. One weak source of randomness at the very first step undid all of it. That is why **you add your own dice**, and why 'the device says it is random' is a claim to check rather than believe." />
            </p>
          </div>

          <Callout>
            <strong>The generation rules, short.</strong>{' '}
            <RichText text="Generate **offline**, on a device whose job is holding keys. Prefer **24 words** for savings. If you can, **add dice or coin-flip randomness** so you trust the entropy. Let the wallet compute the checksum. Then verify a test restore before a single satoshi goes in. And never, ever type a real seed into anything with a network, this site's practice studio included." />
          </Callout>
        </div>

        <div className="sec-block">
          <h2>Back it up so it survives fire, flood, and forgetting</h2>
          <p>
            <RichText text="A wallet dies from a bad backup far more often than from any hacker. The device is replaceable; the words are not. So the words get treated like the only thing that matters, because they are." />
          </p>
          <BackupMap />
          <p>
            <RichText text="**Paper, then steel.** Write the words by hand to start, then stamp or engrave them into steel, which shrugs off the house fire and the burst pipe that turn paper to pulp. **Two places, kept apart.** One backup in one location is a bet against fire and theft that you will eventually lose. **Never digital.** Anything on a networked device can leak, and that includes the photo you meant to delete. **Test the restore.** Wipe a spare wallet, rebuild it from your backup, and confirm the same addresses appear. A backup you have never restored is a hope, not a backup." />
          </p>
          <p>
            <RichText text="**The optional 25th word (a passphrase).** You can add a secret word of your own on top of the seed. It creates a completely different wallet, so a thief who finds your steel plate still gets nothing without it. The danger is symmetrical: every passphrase opens a real, usually empty wallet, and a mistyped one gives no error, it just shows the wrong (empty) wallet. If you use one, back it up with the same discipline as the words, in a different place, or you have simply added a way to lock yourself out." />
          </p>
        </div>

        <div className="sec-block">
          <h2>Multisig: the strongest setup, in plain words</h2>
          <p>
            <RichText text="Everything so far protects **one** key. The strongest common setup protects you even when a key is stolen or lost, by requiring **several**. It is called **multisig** (multi-signature), and the idea is a bank vault that needs two managers turning two keys at once." />
          </p>
          <MultisigDiagram />
          <p>
            <RichText text="You choose a rule like **2 of 3**: three keys exist, held in three different places, and any **two** of them together can spend, but no single one can. To do it well, spread the keys so that no single event can take two of them. Use different devices, ideally from different makers. Keep them in different physical locations. Many people also let a **collaborative-custody** service hold one of the three: the company can help you recover, but with only one key it can never spend on its own. Start at 2 of 3. It is the sweet spot of safety and simplicity." />
          </p>
          <Callout>
            <strong>The multisig footgun almost everyone hits.</strong>{' '}
            <RichText text="A multisig wallet needs more than the seeds to rebuild: it needs the **wallet configuration** (the public keys of all the signers, sometimes called the descriptor). Lose that and even all your seeds may not reassemble the wallet. So back up the configuration alongside every seed backup. It contains no secrets, so it is safe to keep copies, and it is the piece people forget until the day they need it." />
          </Callout>
          <p>
            <RichText text="Multisig is graduate-level, and more moving parts means more procedure to get wrong. So **rehearse the whole thing on signet** ([Quest #11](/quests/send-your-first-play-bitcoin)) before a real coin is involved. Create it, receive to it, lose a key on purpose, and recover from that loss. When the recovery drill has become boring, you are ready." />
          </p>
        </div>

        <div className="sec-block">
          <h2>Day to day: how people actually get fooled</h2>
          <p>
            <RichText text="Once your keys are generated and backed up, the remaining risk is social, not mathematical. The math you verified across this whole site holds. The attacks aim at you instead." />
          </p>
          <p>
            <RichText text="**Nobody ever needs your seed words.** Not support, not an update, not an 'airdrop', not a wallet-validation website, not us. Every request for an existing seed is theft, without exception. The words only ever go into a wallet device you are deliberately restoring, offline. **Verify addresses on the device.** Malware's favourite trick is swapping the address shown on your computer; confirm it on the hardware wallet's own screen, which the malware cannot touch. **Copy addresses from the source, never from your history.** A current scam dusts your wallet with a tiny payment from an address whose first and last characters match one you use, betting you will one day copy *their* address out of your transaction history by mistake. Take every receive address fresh from the sender or your own wallet's receive screen, then check it on the device. **Get software from the source.** Download wallets and firmware only from the official project, prefer open source with reproducible builds, and check signatures (the [wallets checklist](/wallets) shows how to judge one). **Keep spending and savings separate.** A small hot wallet for daily use, cold storage for the rest, so a phone compromise costs you a night out and not your future." />
          </p>
        </div>

        <div className="sec-block">
          <h2>The whole playbook on one screen</h2>
          <div className="sec-cols">
            <div className="sec-col sec-do">
              <div className="sec-col-head">always</div>
              <ul>
                {RULES.map((r) => (
                  <li key={r.do}>{r.do}</li>
                ))}
              </ul>
            </div>
            <div className="sec-col sec-never">
              <div className="sec-col-head">never</div>
              <ul>
                {RULES.map((r) => (
                  <li key={r.never}>{r.never}</li>
                ))}
              </ul>
            </div>
          </div>

          <Callout>
            <strong>If you remember only one thing.</strong>{' '}
            <RichText text="The words are the wallet. Guard them offline, back them up on steel in two places, test the restore, and never type them into anything connected to the internet. Do that, and you have beaten the way nearly everyone who loses bitcoin loses it. The rest is refinement." />
          </Callout>
        </div>

        <p className="cvk-next">
          <Link to="/quests/your-keys-your-coins">← Quest #14: why keys work this way</Link>
          <Link to="/wallets">Which wallet type? →</Link>
        </p>
      </section>
    </main>
  );
}
