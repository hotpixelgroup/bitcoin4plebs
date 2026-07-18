/**
 * Consensus constants, mirrored 1:1 from Bitcoin Core.
 * Every value cites the exact source line it comes from, pinned to
 * commit {@link PINNED_COMMIT}.
 */

/** The Bitcoin Core commit every excerpt and constant in this app is pinned to. */
export const PINNED_COMMIT = '18c05d93016b28a9afd4c716dfe00b6e0accb30b';

/** Short form of {@link PINNED_COMMIT} for display. */
export const PINNED_COMMIT_SHORT = PINNED_COMMIT.slice(0, 7);

/** Base URL for "verify on GitHub" links at the pinned commit. */
export const GITHUB_BLOB_BASE = `https://github.com/bitcoin/bitcoin/blob/${PINNED_COMMIT}`;

/** Satoshis in one BTC — src/consensus/amount.h:15 (`static constexpr CAmount COIN = 100000000;`). */
export const COIN = 100_000_000n;

/** Sanity cap, NOT the supply cap — src/consensus/amount.h:26 (`MAX_MONEY = 21000000 * COIN`). */
export const MAX_MONEY = 21_000_000n * COIN;

/** Halving interval on mainnet — src/kernel/chainparams.cpp:114 (`nSubsidyHalvingInterval = 210000`). */
export const SUBSIDY_HALVING_INTERVAL = 210_000;

/** Initial block subsidy — src/validation.cpp:1853 (`CAmount nSubsidy = 50 * COIN;`). */
export const INITIAL_SUBSIDY = 50n * COIN;
