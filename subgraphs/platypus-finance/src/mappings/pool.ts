// Pools are the liqudity pools (there are only 2 in platypus)

import {
  Deposit,
  Withdraw,
  Swap,
  DevUpdated,
  SlippageParamsUpdated,
  OracleUpdated,
  RetentionRatioUpdated,
  PriceDeviationUpdated,
  HaircutRateUpdated,
  AssetAdded,
} from "../../generated/Pool/Pool";

export function handleDeposit(event: Deposit): void {}
export function handleWithdraw(event: Withdraw): void {}
export function handleSwap(event: Swap): void {}
export function handleDevUpdated(event: DevUpdated): void {}
export function handleSlippageParamsUpdated(event: SlippageParamsUpdated): void {}
export function handleOracleUpdated(event: OracleUpdated): void {}
export function handleRetentionRatioUpdated(event: RetentionRatioUpdated): void {}
export function handlePriceDeviationUpdated(event: PriceDeviationUpdated): void {}
export function handleHaircutRateUpdated(event: HaircutRateUpdated): void {}
export function handleAssetAdded(event: AssetAdded): void {}
