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
import { getCurrentETHPrice, getCurrentLUSDPrice } from "../entities/token";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  BIGDECIMAL_ONE,
  BIGINT_ZERO,
  LIQUIDATION_FEE,
  LIQUIDATION_RESERVE_LUSD,
  STABILITY_POOL,
  LUSD_ADDRESS,
  ACTIVE_POOL,
  ETH_ADDRESS,
} from "../utils/constants";
import { _Trove } from "../../generated/schema";
import {
  addProtocolSideRevenue,
  addSupplySideRevenue,
} from "../entities/protocol";
import { Address, log, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { updateUserPositionBalances } from "../entities/position";
import {
  getOrCreateMarket,
  getOrCreateStabilityPool,
} from "../entities/market";
import { ERC20TransferLog, LiquityEtherSentLog } from "../utils/log";

enum TroveManagerOperation {
  applyPendingRewards,
  liquidateInNormalMode,
  liquidateInRecoveryMode,
  redeemCollateral,
}

export function handleRedemption(event: Redemption): void {
  const feeAmountETH = event.params._ETHFee;
  const feeAmountUSD = bigIntToBigDecimal(feeAmountETH).times(
    getCurrentETHPrice()
  );
  addProtocolSideRevenue(event, feeAmountUSD, getOrCreateMarket());
}

/**
 * Emitted when a trove was updated because of a TroveManagerOperation operation
 *
 * @param event TroveUpdated event
 */
export function handleTroveUpdated(event: TroveUpdated): void {
  const trove = getOrCreateTrove(event.params._borrower);
  const operation = event.params._operation as TroveManagerOperation;
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
  const trove = getOrCreateTrove(event.params._borrower);

  const borrower = event.params._borrower;
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;
  if (trove.debt.gt(newDebt)) {
    log.critical(
      "Tracked trove debt was less than actual debt in TroveLiquidated, actual: {}, tracked: {}",
      [trove.debt.toString(), newDebt.toString()]
    );
  }
  // Gas compensation already subtracted, only when (MCR <= ICR < TCR & SP.LUSD >= trove.debt)
  if (trove.collateral.gt(newCollateral)) {
    // Add gas compensation back to liquidated collateral amount
    trove.collateral = trove.collateral
      .divDecimal(BIGDECIMAL_ONE.minus(LIQUIDATION_FEE))
      .truncate(0).digits;
  }
  // Apply pending rewards if necessary
  let collateralRewardETH = newCollateral.minus(trove.collateral);
  if (trove.collateralSurplusChange.gt(BIGINT_ZERO)) {
    collateralRewardETH = collateralRewardETH.plus(
      trove.collateralSurplusChange
    );
    trove.collateralSurplusChange = BIGINT_ZERO;
  }
  if (collateralRewardETH.gt(BIGINT_ZERO)) {
    const collateralRewardUSD = bigIntToBigDecimal(collateralRewardETH).times(
      getCurrentETHPrice()
    );
    const ethAddress = Address.fromString(ETH_ADDRESS);
    createDeposit(
      event,
      getOrCreateMarket(),
      ethAddress,
      collateralRewardETH,
      collateralRewardUSD,
      borrower
    );
  }
  const borrowAmountLUSD = newDebt.minus(trove.debt);
  if (borrowAmountLUSD.gt(BIGINT_ZERO)) {
    const borrowAmountUSD = bigIntToBigDecimal(borrowAmountLUSD);
    createBorrow(event, borrowAmountLUSD, borrowAmountUSD, borrower);
  }
  trove.collateral = newCollateral;
  trove.debt = newDebt;
  trove.save();

  updateUserPositionBalances(event, trove);
}

// Treat applyPendingRewards as deposit + borrow
function applyPendingRewards(event: TroveUpdated, trove: _Trove): void {
  const borrower = event.params._borrower;
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;
  const ethAddress = Address.fromString(ETH_ADDRESS);

  const collateralRewardETH = newCollateral.minus(trove.collateral);
  const collateralRewardUSD = bigIntToBigDecimal(collateralRewardETH).times(
    getCurrentETHPrice()
  );
  createDeposit(
    event,
    getOrCreateMarket(),
    ethAddress,
    collateralRewardETH,
    collateralRewardUSD,
    borrower
  );
  const borrowAmountLUSD = newDebt.minus(trove.debt);
  const borrowAmountUSD = bigIntToBigDecimal(borrowAmountLUSD);
  createBorrow(event, borrowAmountLUSD, borrowAmountUSD, borrower);
}

// Treat redeemCollateral as repay + withdraw
function redeemCollateral(event: TroveUpdated, trove: _Trove): void {
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;

  const repayAmountLUSD = trove.debt.minus(newDebt);
  const repayAmountUSD = bigIntToBigDecimal(repayAmountLUSD);
  createRepay(
    event,
    repayAmountLUSD,
    repayAmountUSD,
    Address.fromString(trove.id),
    event.transaction.from
  );

  let withdrawAmountETH = trove.collateral.minus(newCollateral);
  // If trove was closed, then extra collateral is sent to CollSurplusPool to be withdrawn by trove owner
  if (trove.collateral.equals(BIGINT_ZERO)) {
    withdrawAmountETH = withdrawAmountETH.minus(trove.collateralSurplusChange);
    trove.collateralSurplusChange = BIGINT_ZERO;
  }
  const withdrawAmountUSD = bigIntToBigDecimal(withdrawAmountETH).times(
    getCurrentETHPrice()
  );
  createWithdraw(
    event,
    getOrCreateMarket(),
    withdrawAmountETH,
    withdrawAmountUSD,
    Address.fromString(trove.id),
    event.transaction.from
  );
}

function liquidateTrove(event: TroveUpdated, trove: _Trove): void {
  const amountLiquidatedETH = trove.collateral;
  const amountLiquidatedUSD = bigIntToBigDecimal(amountLiquidatedETH).times(
    getCurrentETHPrice()
  );
  const profitUSD = amountLiquidatedUSD
    .times(LIQUIDATION_FEE)
    .plus(LIQUIDATION_RESERVE_LUSD);
  createLiquidate(
    event,
    amountLiquidatedETH,
    amountLiquidatedUSD,
    profitUSD,
    Address.fromString(trove.id),
    event.transaction.from
  );
  addProtocolSideRevenue(event, profitUSD, getOrCreateMarket());
}

/**
 * Emitted once per transaction containing at least one liquidation.
 * The event contains the total amount liquidated from all liquidations in the transaction.
 * We use this event to calculate the amount of LUSD that was burned from the stability pool
 * in exchange of how much ETH collateral. From here we calulate StabilityPool revenue.
 *
 * @param event Liquidation event
 */
export function handleLiquidation(event: Liquidation): void {
  // To accurately calculate the revenue generated by the Stability pool we
  // compare the amount of LUSD that was burned to the amount of ETH that was
  // sent to the StabilityPool. The USD difference of both amounts will be the
  // StabilityPool revenue.
  if (!event.receipt) {
    log.error(
      "Unable to calculate liquidation revenue, no receipt found. Tx Hash: {}",
      [event.transaction.hash.toHexString()]
    );
    return;
  }

  let lusdBurned = BIGINT_ZERO;
  let ethSent = BIGINT_ZERO;
  for (let i = 0; i < event.receipt!.logs.length; i++) {
    const log = event.receipt!.logs[i];
    const burned = stabilityPoolLUSDBurn(log);
    if (burned) {
      lusdBurned = lusdBurned.plus(burned);
      continue;
    }

    const ether = etherSentToStabilityPool(log);
    if (ether) {
      ethSent = ethSent.plus(ether);
      continue;
    }
  }

  if (lusdBurned.equals(BIGINT_ZERO) || ethSent.equals(BIGINT_ZERO)) {
    log.error("no LUSD was burned on this liquidation", []);
    return;
  }

  const lusdValue = getCurrentLUSDPrice().times(bigIntToBigDecimal(lusdBurned));
  const ethValue = bigIntToBigDecimal(ethSent).times(getCurrentETHPrice());

  const revenue = ethValue.minus(lusdValue);
  const market = getOrCreateStabilityPool(event);
  addSupplySideRevenue(event, revenue, market);
}

// stabilityPoolLUSDBurn will return the amount of LUSD burned as indicated by this log.
// If the log is not a LUSD burn log, it will return null.
function stabilityPoolLUSDBurn(log: ethereum.Log): BigInt | null {
  const transfer = ERC20TransferLog.parse(log);
  if (!transfer) {
    return null;
  }

  if (transfer.tokenAddr.notEqual(Address.fromString(LUSD_ADDRESS))) {
    return null;
  }

  if (transfer.from.notEqual(Address.fromString(STABILITY_POOL))) {
    return null;
  }

  if (transfer.to.notEqual(Address.zero())) {
    return null;
  }

  return transfer.amount;
}

// etherSentToStabilityPool will return the amount of ETH sent to the StabilityPool.
// If this log is not EtherSent, or the destination is not the StabilityPool it will
// return null.
function etherSentToStabilityPool(log: ethereum.Log): BigInt | null {
  const decoded = LiquityEtherSentLog.parse(log);
  if (!decoded) {
    return null;
  }

  if (decoded.contractAddr.notEqual(Address.fromString(ACTIVE_POOL))) {
    return null;
  }

  if (decoded.to.notEqual(Address.fromString(STABILITY_POOL))) {
    return null;
  }

  return decoded.amount;
}
