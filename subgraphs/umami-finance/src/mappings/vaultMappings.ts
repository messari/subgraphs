import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import { Deposit, Withdraw } from "../../generated/glpWETH/AssetVault";

export function handleDeposit(event: Deposit): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
