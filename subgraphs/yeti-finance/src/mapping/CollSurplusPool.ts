import {
  CollBalanceUpdated,
  CollSurplusPool,
} from "../../generated/CollSurplusPool/CollSurplusPool";
import { createWithdraw } from "../entities/event";
import { getOrCreateTrove, getOrCreateTroveToken } from "../entities/trove";
import { getUSDPriceWithoutDecimals } from "../utils/price";
import { BIGINT_ZERO } from "../utils/constants";
import { incrementProtocolWithdrawCount, updateUsageMetrics } from "../entities/protocol";

/**
 * Whenever a borrower's trove is closed by a non-owner address because of either:
 *   1. Redemption
 *   2. Liquidation in recovery mode with collateral ratio > 110%
 * the remaining collateral is sent to CollSurplusPool to be claimed (withdrawn) by the owner.
 * Because Asset price is not updated during the actual withdrawal, the Withdraw event is instead created upon collateral deposit
 *
 * @param event CollBalanceUpdated event
 */
export function handleCollBalanceUpdated(event: CollBalanceUpdated): void {
  const borrower = event.params._account;
  const trove = getOrCreateTrove(borrower);
  const collSurplusPool = CollSurplusPool.bind(event.address);
  const collateralsSurplus = collSurplusPool.getAmountsClaimable(borrower);

  for (let i = 0; i < collateralsSurplus.value0.length; i++) {
    const token = collateralsSurplus.value0[i];
    const amount = collateralsSurplus.value1[i];
    const troveToken = getOrCreateTroveToken(trove, token);
    if (amount > troveToken.collateralSurplus) {
      troveToken.collateralSurplusChange = amount.minus(
        troveToken.collateralSurplus
      );
      const collateralSurplusUSD = getUSDPriceWithoutDecimals(
        token,
        amount.toBigDecimal()
      );
      createWithdraw(
        event,
        troveToken.collateralSurplusChange,
        collateralSurplusUSD,
        borrower,
        token
      );
    } else {
      troveToken.collateralSurplusChange = BIGINT_ZERO;
    }
    troveToken.collateralSurplus = amount;
    troveToken.save();
  }

  trove.save();
  updateUsageMetrics(event, borrower);
  incrementProtocolWithdrawCount(event);

}
