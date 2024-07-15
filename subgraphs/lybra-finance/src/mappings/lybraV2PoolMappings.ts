import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import {
  Mint,
  Burn,
  FeeDistribution,
} from "../../generated/LybraStETHVault/LybraV2";
import * as constants from "../common/constants";
import { updatePoolOutputTokenSupply, updateV2PoolTVL } from "../common/utils";

export function handleMint(event: Mint): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updateV2PoolTVL(pool);

  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.trackActivity();
}

export function handleBurn(event: Burn): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  updatePoolOutputTokenSupply(pool);
  updateV2PoolTVL(pool);

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
