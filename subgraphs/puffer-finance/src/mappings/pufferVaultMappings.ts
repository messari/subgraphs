import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import { Deposit, Withdraw } from "../../generated/PufferVault/PufferVault";

export function handleDeposit(event: Deposit): void {
  const sender = event.params.sender;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sender = event.params.sender;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}
