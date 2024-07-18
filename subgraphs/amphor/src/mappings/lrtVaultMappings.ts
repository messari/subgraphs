import {
  updatePoolTvlForLRTVaults,
  updatePoolOutputTokenSupply,
} from "../common/utils";
import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import {
  Deposit,
  Withdraw,
} from "../../generated/LRTVault/AmphorSyntheticVault";

export function handleDeposit(event: Deposit): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTvlForLRTVaults(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTvlForLRTVaults(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
