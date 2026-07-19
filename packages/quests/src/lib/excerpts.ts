import type { CodeExcerpt, SourcePin } from './types.js';

/**
 * The single source pin every quest shares, plus excerpts that appear in
 * more than one quest. Excerpts are VERBATIM from Bitcoin Core at the
 * pinned commit — if you touch one, re-diff it against the source.
 */

export const BITCOIN_PIN: SourcePin = {
  repo: 'bitcoin/bitcoin',
  commit: '18c05d93016b28a9afd4c716dfe00b6e0accb30b',
};

/**
 * Second pin, for excerpts quoted from BIP documents. Same rules as the
 * Bitcoin Core pin: letter-for-letter verbatim, diffed in CI against this
 * exact commit of the bips repo (BIPS_SRC locally).
 */
export const BIPS_PIN: SourcePin = {
  repo: 'bitcoin/bips',
  commit: '8c369ac8e60629ac6c032ffe21bb5ec5b35213d7',
};

/** GetBlockSubsidy — the entire emission policy. */
export const EXCERPT_GET_BLOCK_SUBSIDY: CodeExcerpt = {
  ref: { file: 'src/validation.cpp', startLine: 1846, endLine: 1857 },
  language: 'cpp',
  lines: [
    { n: 1846, text: 'CAmount GetBlockSubsidy(int nHeight, const Consensus::Params& consensusParams)', highlight: true },
    { n: 1847, text: '{' },
    { n: 1848, text: '    int halvings = nHeight / consensusParams.nSubsidyHalvingInterval;', highlight: true },
    { n: 1849, text: '    // Force block reward to zero when right shift is undefined.' },
    { n: 1850, text: '    if (halvings >= 64)' },
    { n: 1851, text: '        return 0;' },
    { n: 1852, text: '' },
    { n: 1853, text: '    CAmount nSubsidy = 50 * COIN;', highlight: true },
    { n: 1854, text: '    // Subsidy is cut in half every 210,000 blocks which will occur approximately every 4 years.' },
    { n: 1855, text: '    nSubsidy >>= halvings;', highlight: true },
    { n: 1856, text: '    return nSubsidy;' },
    { n: 1857, text: '}' },
  ],
};

/** The bad-cb-amount check: every node rejects a miner who overpays themselves. */
export const EXCERPT_COINBASE_ENFORCEMENT: CodeExcerpt = {
  ref: { file: 'src/validation.cpp', startLine: 2621, endLine: 2625 },
  language: 'cpp',
  lines: [
    { n: 2621, text: '    CAmount blockReward = nFees + GetBlockSubsidy(pindex->nHeight, params.GetConsensus());', highlight: true },
    { n: 2622, text: '    if (block.vtx[0]->GetValueOut() > blockReward && state.IsValid()) {', highlight: true },
    { n: 2623, text: '        state.Invalid(BlockValidationResult::BLOCK_CONSENSUS, "bad-cb-amount",' },
    { n: 2624, text: '                      strprintf("coinbase pays too much (actual=%d vs limit=%d)", block.vtx[0]->GetValueOut(), blockReward));' },
    { n: 2625, text: '    }' },
  ],
};

/** MAX_MONEY — the sanity cap, with the developers' own honesty comment. */
export const EXCERPT_MAX_MONEY: CodeExcerpt = {
  ref: { file: 'src/consensus/amount.h', startLine: 17, endLine: 27 },
  language: 'cpp',
  lines: [
    { n: 17, text: '/** No amount larger than this (in satoshi) is valid.' },
    { n: 18, text: ' *' },
    { n: 19, text: ' * Note that this constant is *not* the total money supply, which in Bitcoin', highlight: true },
    { n: 20, text: ' * currently happens to be less than 21,000,000 BTC for various reasons, but', highlight: true },
    { n: 21, text: ' * rather a sanity check. As this sanity check is used by consensus-critical' },
    { n: 22, text: ' * validation code, the exact value of the MAX_MONEY constant is consensus' },
    { n: 23, text: ' * critical; in unusual circumstances like a(nother) overflow bug that allowed' },
    { n: 24, text: ' * for the creation of coins out of thin air modification could lead to a fork.' },
    { n: 25, text: ' * */' },
    { n: 26, text: 'static constexpr CAmount MAX_MONEY = 21000000 * COIN;', highlight: true },
    { n: 27, text: 'inline bool MoneyRange(const CAmount& nValue) { return (nValue >= 0 && nValue <= MAX_MONEY); }' },
  ],
};

/** The datacarrier relay-policy defaults — the most argued-about lines in Bitcoin right now. */
export const EXCERPT_DATACARRIER_DEFAULTS: CodeExcerpt = {
  ref: { file: 'src/policy/policy.h', startLine: 79, endLine: 84 },
  language: 'cpp',
  lines: [
    { n: 79, text: '/** Default for -datacarrier */' },
    { n: 80, text: 'static const bool DEFAULT_ACCEPT_DATACARRIER = true;', highlight: true },
    { n: 81, text: '/**' },
    { n: 82, text: ' * Default setting for -datacarriersize in vbytes.' },
    { n: 83, text: ' */' },
    { n: 84, text: 'static const unsigned int MAX_OP_RETURN_RELAY = MAX_STANDARD_TX_WEIGHT / WITNESS_SCALE_FACTOR;', highlight: true },
  ],
};

/** CAmount + COIN — money is whole numbers of satoshis. */
export const EXCERPT_COIN_DEFINITION: CodeExcerpt = {
  ref: { file: 'src/consensus/amount.h', startLine: 11, endLine: 15 },
  language: 'cpp',
  lines: [
    { n: 11, text: '/** Amount in satoshis (Can be negative) */' },
    { n: 12, text: 'typedef int64_t CAmount;', highlight: true },
    { n: 13, text: '' },
    { n: 14, text: '/** The amount of satoshis in one BTC. */' },
    { n: 15, text: 'static constexpr CAmount COIN = 100000000;', highlight: true },
  ],
};
