import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import {
  Mint,
  Burn,
  Wrap,
  Unwrap,
} from "../../generated/templates/FewWrappedToken/FewWrappedToken";

export function handleMint(event: Mint): void {
  const sender = event.transaction.from;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleBurn(event: Burn): void {
  const sender = event.transaction.from;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleWrap(event: Wrap): void {
  const sender = event.transaction.from;

  const sdk = initializeSDKFromEvent(event);
  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleUnwrap(event: Unwrap): void {
  const sender = event.transaction.from;

  const sdk = initializeSDKFromEvent(event);
  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}
