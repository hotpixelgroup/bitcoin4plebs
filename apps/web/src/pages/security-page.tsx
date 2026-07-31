import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Callout, RichText } from '@bitcoin4plebs/ui';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";

interface Tier {
  amount: string;
  setup: string;
  why: string;
}

const LADDER: Tier[] = [
  {
    amount: 'Pocket money (a night out)',
    setup: 'A reputable open-source phone wallet',
    why: 'Convenient, always with you. Fine to risk, like cash in a wallet.',
  },
  {
    amount: 'Savings (would hurt to lose)',
    setup: 'One hardware signer, seed on steel',
    why: 'Keys never touch a networked machine. One good backup covers it.',
  },
  {
    amount: 'Life savings',
    setup: 'Multisig: 2 of 3 keys, kept apart',
    why: 'No single point of failure. A thief needs two keys; you can lose one and recover.',
  },
  {
    amount: 'Generational / a business',
    setup: 'Multisig with a plan for inheritance',
    why: 'Someone you trust can recover it if you cannot, without holding the keys today.',
  },
];

interface Rule {
  do: string;
  never: string;
}

const RULES: Rule[] = [
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

/**
 * Reference page: the practical security playbook. Distinct from Quest #14
 * (the lesson) and /wallets (which type to pick), this is the how-to for
 * generation, entropy, backups, multisig, and day-to-day opsec, in the
 * plainest language possible. Brandless, honest about trade-offs.
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
        <h2>First: how safe do you actually need to be?</h2>
        <p>
          <RichText text="Security is a dial, not a switch. Guarding a coffee fund like a gold vault will just make you never use it; guarding your life savings like pocket money is how people get hurt. Match the effort to the stakes, exactly as you already do with cash." />
        </p>
        <div className="contrast-wrap">
          <table className="contrast" aria-label="Security setup by amount">
            <thead>
              <tr>
                <th>How much is at stake</th>
                <th>A sane setup</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {LADDER.map((t) => (
                <tr key={t.amount}>
                  <td>{t.amount}</td>
                  <td>{t.setup}</td>
                  <td>{t.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <RichText text="Pick your rung, then climb one step at a time. Every move up should be rehearsed with worthless practice coins first ([Quest #11 · signet](/quests/send-your-first-play-bitcoin)) and with a tiny test amount on real Bitcoin always. Choosing *where* the keys live is the [wallets page](/wallets); this page is how to run whichever you pick, safely." />
        </p>

        <h2>Generate your keys with real randomness</h2>
        <p>
          <RichText text="Your seed words are one enormous random number in disguise (you saw the recipe in [Quest #14](/quests/your-keys-your-coins)). Its whole strength is that number being **truly random**, so nobody can ever guess it. This is called **entropy**, and it is the one place where doing it yourself, wrong, can quietly ruin everything." />
        </p>
        <p>
          <RichText text="Two mistakes destroy the randomness, and both are common. The first is inventing your own 'clever' phrase, a favourite quote, a birthday, a pattern. Software that turns text into a key is called a **brain wallet**, and wallets built that way get emptied within minutes by bots that try every phrase humans think of. Never choose your own words; let real randomness choose them. The second is trusting a black box: a wallet generates a seed and you have no way to know its randomness was real." />
        </p>
        <p>
          <RichText text="The verify-don't-trust answer is to **add your own randomness**. Good hardware wallets let you flip a coin or roll dice and feed the results in, then the device still computes the checksum so the phrase is valid. Now the randomness is partly yours, and you never had to trust the machine's hidden dice. Twelve words is already 128 bits, which is 2^128 possible phrases: a **39-digit number**, and you can feel exactly how hopeless guessing it is in [Quest #3's finale](/quests/what-stops-someone-spending-your-coins). **24 words (256 bits)** is the belt-and-braces maximum the standard allows." />
        </p>
        <Callout>
          <strong>The generation rules, short.</strong>{' '}
          <RichText text="Generate **offline**, on a device whose job is holding keys. Prefer **24 words** for savings. If you can, **add dice or coin-flip randomness** so you trust the entropy. Let the wallet compute the checksum. Then verify a test restore before a single satoshi goes in. And never, ever type a real seed into anything with a network, this site's practice studio included." />
        </Callout>

        <h2>Back it up so it survives fire, flood, and forgetting</h2>
        <p>
          <RichText text="A wallet dies from a bad backup far more often than from any hacker. The device is replaceable; the words are not. So the words get treated like the only thing that matters, because they are." />
        </p>
        <p>
          <RichText text="**Paper, then steel.** Write the words by hand to start; then stamp or engrave them into steel, which shrugs off the house fire and the burst pipe that turn paper to pulp. **Two places, kept apart.** One backup in one location is a bet against fire and theft you will eventually lose; a second copy somewhere geographically separate defeats both. **Never digital.** No photo, no screenshot, no cloud drive, no email to yourself, no notes app, no password manager holding the raw words; anything on a networked device can leak. **Test the restore.** Wipe a spare wallet, rebuild it from your backup, confirm the same addresses appear. A backup you have never restored is a hope, not a backup." />
        </p>
        <p>
          <RichText text="**The optional 25th word (a passphrase).** You can add a secret word of your own on top of the seed. It creates a completely different wallet, so a thief who finds your steel plate still gets nothing without it. The danger is symmetrical: every passphrase opens a real, usually empty wallet, and a mistyped one gives no error, it just shows the wrong (empty) wallet. If you use one, back it up with the same discipline as the words, in a different place, or you have simply added a way to lock yourself out." />
        </p>

        <h2>Multisig: the strongest setup, in plain words</h2>
        <p>
          <RichText text="Everything so far protects **one** key. The strongest common setup protects you even when a key is stolen or lost, by requiring **several**. It is called **multisig** (multi-signature), and the idea is a bank vault that needs two managers turning two keys at once." />
        </p>
        <p>
          <RichText text="You choose a rule like **2 of 3**: three keys exist, held in three different places, and any **two** of them together can spend, but no single one can. Read what that buys you, because it fixes the two worst nightmares at the same time. A **thief** who steals one key (breaks into one location, compromises one device) still cannot move a coin; they would need to breach two places at once. And **you** can lose one key entirely, a device dies, a location burns, and still recover everything with the other two. Single-key custody makes you choose which disaster to fear; multisig answers both." />
        </p>
        <p>
          <RichText text="To do it well, spread the keys so that no single event can take two of them. Use different devices, ideally from different makers. Keep them in different physical locations. Many people also let a **collaborative-custody** service hold one of the three: the company can help you recover, but with only one key it can never spend on its own. Start at 2 of 3. It is the sweet spot of safety and simplicity." />
        </p>
        <Callout>
          <strong>The multisig footgun almost everyone hits.</strong>{' '}
          <RichText text="A multisig wallet needs more than the seeds to rebuild: it needs the **wallet configuration** (the public keys of all the signers, sometimes called the descriptor). Lose that and even all your seeds may not reassemble the wallet. So back up the configuration file alongside every seed backup. It contains no secrets, so it is safe to keep copies, and it is the piece people forget until the day they need it." />
        </Callout>
        <p>
          <RichText text="Multisig is graduate-level, and more moving parts means more procedure to get wrong. So **rehearse the whole thing on signet** ([Quest #11](/quests/send-your-first-play-bitcoin)) before a real coin is involved. Create it, receive to it, lose a key on purpose, and recover from that loss. When the recovery drill has become boring, you are ready." />
        </p>

        <h2>Day to day: how people actually get fooled</h2>
        <p>
          <RichText text="Once your keys are generated and backed up, the remaining risk is social, not mathematical. The math you verified across this whole site holds; the attacks aim at you." />
        </p>
        <p>
          <RichText text="**Nobody ever needs your seed words.** Not support, not an update, not an 'airdrop', not a wallet-validation website, not us. Every request for an existing seed is theft, without exception, so the rule is simply that the words only ever go into a wallet device you are deliberately restoring, offline. **Verify addresses on the device.** Malware's favourite trick is swapping the receive or send address shown on your computer; confirm it on the hardware wallet's own screen, which the malware cannot touch. **Get software from the source.** Download wallets and firmware only from the official project, prefer open-source with reproducible builds, and check signatures (the [wallets checklist](/wallets) shows how to judge one). **Keep spending and savings separate.** A small hot wallet for daily use, cold storage for the rest, so a phone compromise costs you a night out, not your future." />
        </p>

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

        <p className="cvk-next">
          <Link to="/quests/your-keys-your-coins">← Quest #14: why keys work this way</Link>
          <Link to="/wallets">Which wallet type? →</Link>
        </p>
      </section>
    </main>
  );
}
