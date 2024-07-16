import {
  getOrCreateV2Pool,
  initializeSDKFromEvent,
} from "../common/initializers";
import {
  Stake,
  Unstake,
} from "../../generated/ERC20PointsDeposit/ERC20PointsDeposit";
import * as constants from "../common/constants";
import { updateV2PoolsLpTokenPrice } from "../common/utils";

export function handleStake(event: Stake): void {
  const amount = event.params.amount;
  const poolAddress = event.params.lpToken;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreateV2Pool(poolAddress, sdk);

  updateV2PoolsLpTokenPrice(pool, sdk);
  pool.addInputTokenBalances(
    [constants.BIGINT_ZERO, constants.BIGINT_ZERO, amount],
    true
  );

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleUnStake(event: Unstake): void {
  const amount = event.params.amount.times(constants.BIGINT_MINUS_ONE);
  const poolAddress = event.params.lpToken;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreateV2Pool(poolAddress, sdk);

  updateV2PoolsLpTokenPrice(pool, sdk);
  pool.addInputTokenBalances(
    [constants.BIGINT_ZERO, constants.BIGINT_ZERO, amount],
    true
  );

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}
