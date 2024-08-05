import {
  updatePoolTVL,
  updatePoolOutputTokenSupply,
  getProtocolFee,
} from "../common/utils";
import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Deposit, Withdraw, Harvest } from "../../generated/UnionVault/VaultV2";

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

export function handleHarvest(event: Harvest): void {
  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  const platformFee = getProtocolFee(pool);
  const totalRevenue = event.params.value;

  const protocolSideRevenue = totalRevenue
    .times(platformFee)
    .div(constants.FEE_DENOMINATOR);
  const supplySideRevenue = totalRevenue.minus(protocolSideRevenue);

  pool.addRevenueNative(
    pool.getInputToken(constants.INT_ZERO),
    supplySideRevenue,
    protocolSideRevenue
  );
}
