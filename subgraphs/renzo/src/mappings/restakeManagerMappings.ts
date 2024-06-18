import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import {
  Deposit1 as Deposit,
  Deposit as DepositL2,
  UserWithdrawCompleted,
} from "../../generated/RestakeManager/RestakeManager";

export function handleDeposit(event: Deposit): void {
  const sender = event.params.depositor;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleDepositL2(event: DepositL2): void {
  const sender = event.params.user;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleUserWithdrawCompleted(
  event: UserWithdrawCompleted
): void {
  const sender = event.params.withdrawer;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}
