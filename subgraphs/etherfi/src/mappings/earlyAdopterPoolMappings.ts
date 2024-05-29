import {
  updatePoolTVL,
  initializeSDKFromEvent,
  updatePoolOutputTokenSupply,
  getOrCreateEarlyAdopterPool,
} from "../common/initializers";
import {
  Withdrawn,
  DepositEth,
  DepositERC20,
  ERC20TVLUpdated,
} from "../../generated/EarlyAdopterPool/EarlyAdopterPool";

export function handleERC20TVLUpdated(event: ERC20TVLUpdated): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreateEarlyAdopterPool(event.address, sdk);

  pool.setInputTokenBalances(
    [
      event.params.rETHBal,
      event.params.wstETHBal,
      event.params.sfrxETHBal,
      event.params.cbETHBal,
      event.params.ETHBal,
    ],
    true
  );

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);
}

export function handleDepositEth(event: DepositEth): void {
  const sender = event.params.sender;
  const sdk = initializeSDKFromEvent(event);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleDepositERC20(event: DepositERC20): void {
  const sender = event.params.sender;
  const sdk = initializeSDKFromEvent(event);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}

export function handleWithdrawn(event: Withdrawn): void {
  const sender = event.params.sender;
  const sdk = initializeSDKFromEvent(event);

  const account = sdk.Accounts.loadAccount(sender);
  account.trackActivity();
}
