import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Mint, Burn, FeeDistribution } from "../../generated/LybraV1/LybraV1";
import { updatePoolOutputTokenSupply, updateV1PoolTVL } from "../common/utils";

export function handleMint(event: Mint): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updateV1PoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleBurn(event: Burn): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updateV1PoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleFeeDistribution(event: FeeDistribution): void {
  const fees = event.params.feeAmount;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  const inputToken = pool.getInputToken(constants.INT_ZERO);

  pool.addRevenueNative(inputToken, fees, fees);
}
