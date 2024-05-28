import {
  initializeSDK,
  updatePoolTVL,
  getOrCreatePool,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import {
  Deposit,
  Withdraw,
  Deposit1 as DepositWithSource,
  Withdraw1 as WithdrawWithSource,
} from "../../generated/LiquidityPool/LiquidityPool";

export function handleDeposit(event: Deposit): void {
  const sender = event.params.sender;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleDepositWithSource(event: DepositWithSource): void {
  const sender = event.params.sender;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sender = event.params.sender;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleWithdrawWithSource(event: WithdrawWithSource): void {
  const sender = event.params.sender;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}
