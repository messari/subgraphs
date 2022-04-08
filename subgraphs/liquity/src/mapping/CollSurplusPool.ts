import { CollBalanceUpdated } from "../../generated/CollSurplusPool/CollSurplusPool";
import { createWithdraw } from "../entities/event";
import { getCurrentETHPrice } from "../entities/price";
import { getOrCreateTrove } from "../entities/trove";
import { BIGINT_ZERO } from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

// Withdraw event is created immediately upon collateral addition because ETH price is not updated during collateral withdraw flow
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
      trove.collateralSurplus,
      collateralSurplusUSD,
      borrower
    );
  } else {
    trove.collateralSurplusChange = BIGINT_ZERO;
  }
  trove.collateralSurplus = collateralSurplusETH;
  trove.save();
}
