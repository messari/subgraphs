import { CollBalanceUpdated } from "../../generated/CollSurplusPool/CollSurplusPool";
import { createWithdraw } from "../entities/event";
import { getCurrentETHPrice } from "../entities/price";
import { getOrCreateTrove } from "../entities/trove";
import { BIGINT_ZERO } from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

/**
 * Whenever a borrower's trove is closed by a non-owner address because of either:
 *   1. Redemption
 *   2. Liquidation in recovery mode with collateral ratio > 110%
 * the remaining collateral is sent to CollSurplusPool to be claimed (withdrawn) by the owner.
 * Because ETH price is not updated during the actual withdrawal, the Withdraw event is instead created upon collateral deposit
 *
 * @param event CollBalanceUpdated event
 */
export function handleCollBalanceUpdated(event: CollBalanceUpdated): void {
  const borrower = event.params._account;
  const collateralSurplusETH = event.params._newBalance;
  const trove = getOrCreateTrove(borrower);
  if (collateralSurplusETH > trove.collateralSurplus) {
    trove.collateralSurplusChange = collateralSurplusETH.minus(
      trove.collateralSurplus
    );
    const collateralSurplusUSD = bigIntToBigDecimal(
      trove.collateralSurplusChange
    ).times(getCurrentETHPrice());
    createWithdraw(
      event,
      trove.collateralSurplusChange,
      collateralSurplusUSD,
      borrower
    );
  } else {
    trove.collateralSurplusChange = BIGINT_ZERO;
  }
  trove.collateralSurplus = collateralSurplusETH;
  trove.save();
}
