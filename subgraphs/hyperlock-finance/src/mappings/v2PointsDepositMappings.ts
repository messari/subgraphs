import {
  updatePoolTVL,
  getOrCreateV2Pool,
  initializeSDKFromEvent,
} from "../common/initializers";
import {
  Stake,
  Unstake,
} from "../../generated/ERC20PointsDeposit/ERC20PointsDeposit";

export function handleStake(event: Stake): void {
  const amount = event.params.amount;
  const poolAddress = event.params.lpToken;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreateV2Pool(poolAddress, sdk);

  updatePoolTVL(pool, amount);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleUnStake(event: Unstake): void {}
