import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import {
  Deposit,
  Withdraw,
  EpochEnd,
} from "../../generated/LRTVault/AmphorSyntheticVault";
import * as constants from "../common/constants";
import { updatePoolOutputTokenSupply, updatePoolTVL } from "../common/utils";

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

export function handleEpochEnd(event: EpochEnd): void {
  const fees = event.params.fees;
  const returnedAssets = event.params.returnedAssets;
  const lastSavedBalance = event.params.lastSavedBalance;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  let supplySideRevenue = constants.BIGINT_ZERO;
  if (returnedAssets.gt(lastSavedBalance)) {
    supplySideRevenue = returnedAssets.minus(lastSavedBalance);
  }
  const protocolSideRevenue = fees;

  pool.addRevenueNative(
    pool.getInputToken(constants.INT_ZERO),
    supplySideRevenue,
    protocolSideRevenue
  );
}
