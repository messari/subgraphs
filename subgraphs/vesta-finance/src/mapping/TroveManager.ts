import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Redemption,
  TroveLiquidated,
  TroveUpdated,
  Liquidation,
} from "../../generated/TroveManager/TroveManager";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { getOrCreateTrove } from "../entities/trove";
import {
  getCurrentAssetPrice,
  getOrCreateAssetToken,
  getVSTTokenPrice,
} from "../entities/token";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  ACTIVE_POOL_ADDRESS,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  LIQUIDATION_FEE,
  LIQUIDATION_RESERVE_VST,
  VST_ADDRESS,
} from "../utils/constants";
import { _AssetToStabilityPool, _Trove } from "../../generated/schema";
import {
  addProtocolSideRevenue,
  addSupplySideRevenue,
} from "../entities/protocol";
import { updateUserPositionBalances } from "../entities/position";
import { AssetSentLog, ERC20TransferLog } from "../utils/logs";
import {
  getOrCreateMarket,
  getOrCreateStabilityPool,
} from "../entities/market";

enum TroveManagerOperation {
  applyPendingRewards,
  liquidateInNormalMode,
  liquidateInRecoveryMode,
  redeemCollateral,
}

export function handleRedemption(event: Redemption): void {
  const asset = event.params._asset;
  const market = getOrCreateMarket(asset);
  const feeAmountAsset = event.params._AssetFee;
  const feeAmountUSD = bigIntToBigDecimal(feeAmountAsset).times(
    getCurrentAssetPrice(event.params._asset)
  );
  addProtocolSideRevenue(event, market, feeAmountUSD);
}

/**
 * Emitted when a trove was updated because of a TroveManagerOperation operation
 *
 * @param event TroveUpdated event
 */
export function handleTroveUpdated(event: TroveUpdated): void {
  const trove = getOrCreateTrove(event.params._borrower, event.params._asset);
  const operation = event.params.operation as TroveManagerOperation;
  switch (operation) {
    case TroveManagerOperation.applyPendingRewards:
      applyPendingRewards(event, trove);
      break;
    case TroveManagerOperation.redeemCollateral:
      redeemCollateral(event, trove);
      break;
    case TroveManagerOperation.liquidateInNormalMode:
    case TroveManagerOperation.liquidateInRecoveryMode:
      liquidateTrove(event, trove);
      break;
  }
  trove.asset = event.params._asset.toHexString();
  trove.owner = event.params._borrower.toHexString();
  trove.collateral = event.params._coll;
  trove.debt = event.params._debt;
  trove.save();

  updateUserPositionBalances(event, trove);
}

/**
 * Emitted for each trove liquidated during batch liquidation flow, right before TroveUpdated event
 * Used to check for and apply pending rewards, since no event is emitted for this during liquidation
 *
 * @param event TroveLiquidated event
 */
export function handleTroveLiquidated(event: TroveLiquidated): void {
  const trove = getOrCreateTrove(event.params._borrower, event.params._asset);
  const asset = event.params._asset;
  const market = getOrCreateMarket(asset);
  const borrower = event.params._borrower;
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;
  // Gas compensation already subtracted, only when (MCR <= ICR < TCR & SP.VST >= trove.debt)
  if (trove.collateral.gt(newCollateral)) {
    // Add gas compensation back to liquidated collateral amount
    trove.collateral = trove.collateral
      .divDecimal(BIGDECIMAL_ONE.minus(LIQUIDATION_FEE))
      .truncate(0).digits;
  }
  // Apply pending rewards if necessary
  let collateralRewardAsset = newCollateral.minus(trove.collateral);
  if (trove.collateralSurplusChange.gt(BIGINT_ZERO)) {
    collateralRewardAsset = collateralRewardAsset.plus(
      trove.collateralSurplusChange
    );
    trove.collateralSurplusChange = BIGINT_ZERO;
  }
  if (collateralRewardAsset.gt(BIGINT_ZERO)) {
    const collateralRewardUSD = bigIntToBigDecimal(collateralRewardAsset).times(
      getCurrentAssetPrice(asset)
    );
    createDeposit(
      event,
      market,
      collateralRewardAsset,
      collateralRewardUSD,
      borrower
    );
  }
  const borrowAmountVST = newDebt.minus(trove.debt);
  if (borrowAmountVST.gt(BIGINT_ZERO)) {
    const borrowAmountUSD = bigIntToBigDecimal(borrowAmountVST);
    createBorrow(event, market, borrowAmountVST, borrowAmountUSD, borrower);
  }
  trove.asset = event.params._asset.toHexString();
  trove.owner = event.params._borrower.toHexString();
  trove.collateral = newCollateral;
  trove.debt = newDebt;
  trove.save();

  updateUserPositionBalances(event, trove);
}

// Treat applyPendingRewards as deposit + borrow
function applyPendingRewards(event: TroveUpdated, trove: _Trove): void {
  const asset = event.params._asset;
  const market = getOrCreateMarket(asset);
  const borrower = event.params._borrower;
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;

  const collateralRewardAsset = newCollateral.minus(trove.collateral);
  const collateralRewardUSD = bigIntToBigDecimal(collateralRewardAsset).times(
    getCurrentAssetPrice(asset)
  );
  createDeposit(
    event,
    market,
    collateralRewardAsset,
    collateralRewardUSD,
    borrower
  );
  const borrowAmountVST = newDebt.minus(trove.debt);
  const borrowAmountUSD = bigIntToBigDecimal(borrowAmountVST);
  createBorrow(event, market, borrowAmountVST, borrowAmountUSD, borrower);
}

// Treat redeemCollateral as repay + withdraw
function redeemCollateral(event: TroveUpdated, trove: _Trove): void {
  const asset = event.params._asset;
  const market = getOrCreateMarket(asset);
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;

  const repayAmountVST = trove.debt.minus(newDebt);
  const repayAmountUSD = bigIntToBigDecimal(repayAmountVST);
  createRepay(
    event,
    market,
    repayAmountVST,
    repayAmountUSD,
    Address.fromString(trove.owner),
    event.transaction.from
  );

  let withdrawAmountAsset = trove.collateral.minus(newCollateral);
  // If trove was closed, then extra collateral is sent to CollSurplusPool to be withdrawn by trove owner
  if (trove.collateral.equals(BIGINT_ZERO)) {
    withdrawAmountAsset = withdrawAmountAsset.minus(
      trove.collateralSurplusChange
    );
    trove.collateralSurplusChange = BIGINT_ZERO;
  }
  const withdrawAmountUSD = bigIntToBigDecimal(withdrawAmountAsset).times(
    getCurrentAssetPrice(asset)
  );
  createWithdraw(
    event,
    market,
    withdrawAmountAsset,
    withdrawAmountUSD,
    Address.fromString(trove.owner),
    event.transaction.from
  );
}

function liquidateTrove(event: TroveUpdated, trove: _Trove): void {
  const asset = event.params._asset;
  const market = getOrCreateMarket(asset);
  const amountLiquidatedAsset = trove.collateral;
  const amountLiquidatedUSD = bigIntToBigDecimal(amountLiquidatedAsset).times(
    getCurrentAssetPrice(asset)
  );
  const profitUSD = amountLiquidatedUSD
    .times(LIQUIDATION_FEE)
    .plus(LIQUIDATION_RESERVE_VST);
  createLiquidate(
    event,
    market,
    amountLiquidatedAsset,
    amountLiquidatedUSD,
    profitUSD,
    Address.fromString(trove.owner),
    event.transaction.from
  );
  const liquidatedDebtUSD = bigIntToBigDecimal(trove.debt);
  const supplySideRevenueUSD = amountLiquidatedUSD
    .times(BIGDECIMAL_ONE.minus(LIQUIDATION_FEE))
    .minus(liquidatedDebtUSD);

  if (supplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    addSupplySideRevenue(event, market, supplySideRevenueUSD);
  }
  addProtocolSideRevenue(event, market, profitUSD);
}

/**
 * Emitted once per transaction containing at least one liquidation.
 * The event contains the total amount liquidated from all liquidations in the transaction.
 * We use this event to calculate the amount of VST that was burned from the stability pool
 * in exchange of how much Asset collateral. From here we calulate StabilityPool revenue.
 *
 * @param event Liquidation event
 */
export function handleLiquidation(event: Liquidation): void {
  // To accurately calculate the revenue generated by the Stability pool we
  // compare the amount of VST that was burned to the amount of Asset that was
  // sent to the StabilityPool. The USD difference of the amounts will be the
  // StabilityPool revenue.
  if (!event.receipt) {
    log.error(
      "[handleLiquidation]Unable to calculate liquidation revenue, no receipt found. Tx Hash: {}",
      [event.transaction.hash.toHexString()]
    );
    return;
  }

  const asset = event.params._asset;
  const stabilityPoolID = _AssetToStabilityPool.load(asset.toHexString())!
    .stabilityPool!;
  const stabilityPoolAddress = Address.fromString(stabilityPoolID);

  let vstBurned = BIGINT_ZERO;
  let assetSent = BIGINT_ZERO;
  for (let i = 0; i < event.receipt!.logs.length; i++) {
    const txLog = event.receipt!.logs[i];
    const burned = stabilityPoolVSTBurn(txLog, stabilityPoolAddress);
    if (burned) {
      vstBurned = vstBurned.plus(burned);
      continue;
    }

    const assetAmount = assetSentToStabilityPool(txLog, stabilityPoolAddress);
    if (assetAmount) {
      assetSent = assetSent.plus(assetAmount);
      continue;
    }
  }

  if (vstBurned.equals(BIGINT_ZERO) || assetSent.equals(BIGINT_ZERO)) {
    log.error(
      "[handleLiquidation]no VST burned {} or asset sent {} on this liquidationtx {}",
      [
        vstBurned.toString(),
        assetSent.toString(),
        event.transaction.hash.toHexString(),
      ]
    );
    return;
  }

  const market = getOrCreateStabilityPool(stabilityPoolAddress, null, event);
  const vstPriceUSD = getVSTTokenPrice(event);
  const vstValueUSD = vstPriceUSD.times(bigIntToBigDecimal(vstBurned));

  const assetPrice = getCurrentAssetPrice(asset);
  const token = getOrCreateAssetToken(asset);
  const assetValueUSD = bigIntToBigDecimal(assetSent, token.decimals).times(
    assetPrice
  );

  const revenue = assetValueUSD.minus(vstValueUSD);
  log.info(
    "[handleLiquidation]tx {} market {} asset={} revenue={}: vstBurned={},vstPrice={},assetSent={},assetPrice={}",
    [
      event.transaction.hash.toHexString(),
      market.id,
      asset.toHexString(),
      revenue.toString(),
      vstBurned.toString(),
      vstPriceUSD.toString(),
      assetSent.toString(),
      assetPrice.toString(),
    ]
  );

  addSupplySideRevenue(event, market, revenue);
}

// stabilityPoolVSTBurn will return the amount of VST burned as indicated by this log.
// If the log is not a VST burn log, it will return null.
function stabilityPoolVSTBurn(
  txLog: ethereum.Log,
  spAddress: Address
): BigInt | null {
  const transfer = ERC20TransferLog.parse(txLog);
  if (!transfer) {
    return null;
  }

  if (
    transfer.tokenAddr.equals(Address.fromString(VST_ADDRESS)) &&
    transfer.from.equals(spAddress) &&
    transfer.to.equals(Address.zero())
  ) {
    return transfer.amount;
  }

  return null;
}

// assetSentToStabilityPool will return the amount of asset sent to the StabilityPool.
// If this log is not AssetSent, or the destination is not the StabilityPool it will
// return null.
function assetSentToStabilityPool(
  log: ethereum.Log,
  spAddress: Address
): BigInt | null {
  const decoded = AssetSentLog.parse(log);
  if (!decoded) {
    return null;
  }

  if (
    decoded.contractAddr.equals(Address.fromString(ACTIVE_POOL_ADDRESS)) &&
    decoded.to.equals(spAddress)
  ) {
    return decoded.amount;
  }

  return null;
}
