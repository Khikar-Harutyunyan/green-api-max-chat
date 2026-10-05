/** Caps the avatar lookups fired at once on an account with many chats. */
export const AVATAR_BATCH_LIMIT = 20;

/**
 * How long a looked-up photo is trusted before asking again. getAvatar has a
 * monthly quota (100 calls on the free tariff), so it cannot run on every load.
 * "No photo" is re-checked sooner, so a newly set photo still shows up.
 */
export const AVATAR_RECHECK_MS = 7 * 24 * 60 * 60 * 1000;
export const NO_AVATAR_RECHECK_MS = 24 * 60 * 60 * 1000;

/**
 * Long-poll window for receiveNotification. Measured on a live MAX instance
 * (2026-10-04): an idle call answers 408 after the window plus ~5s, at every
 * value from 5 to 45, while 60 hung for over three minutes and ended in a 504.
 * 30 keeps a wide margin below that.
 */
export const DEFAULT_RECEIVE_TIMEOUT_SECONDS = 30;
