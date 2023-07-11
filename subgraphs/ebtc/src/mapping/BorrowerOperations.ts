import { Address } from "@graphprotocol/graph-ts";
import { CdpUpdated } from "../../generated/BorrowerOperations/BorrowerOperations";
import { getUsdPrice } from "../prices";
import { BIGINT_TEN_TO_EIGHTEENTH, BIGINT_ZERO } from "../sdk/util/constants";
import { getDataManager, STETH_ADDRESS } from "../constants";

/**
 * Create withdrawals, deposits, borrows, and repays when a CDP is updated.
 * @param event CdpUpdated The event emitted by BorrowerOperations when a CDP
 * is updated.
 */
export function handleCdpUpdated(event: CdpUpdated): void {
  const dataManager = getDataManager(event);
  const deltaColl = event.params._coll.minus(event.params._oldColl);
  if (deltaColl > BIGINT_ZERO) {
    dataManager.createDeposit(
      STETH_ADDRESS, // asset: Bytes
      event.params._borrower, // account: Bytes
      deltaColl, // amount: BigInt
      getUsdPrice(
        Address.fromBytes(STETH_ADDRESS),
        deltaColl.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal(),
        event.block
      ), // amountUSD: BigDecimal
      event.params._debt // newBalance: BigInt
    );
  } else {
    dataManager.createWithdraw(
      STETH_ADDRESS, // asset: Bytes
      event.params._borrower, // account: Bytes
      deltaColl, // amount: BigInt
      getUsdPrice(
        Address.fromBytes(STETH_ADDRESS),
        deltaColl.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal(),
        event.block
      ), // amountUSD: BigDecimal
      event.params._coll // newBalance: BigInt
    );
  }

  const deltaDebt = event.params._debt.minus(event.params._oldDebt);
  if (deltaDebt > BIGINT_ZERO) {
    // createBorrow(
    //     asset: Bytes
    //     account: Bytes
    //     amount: BigInt
    //     amountUSD: BigDecimal
    //     newBalance: BigInt
    //     tokenPriceUSD: BigDecimal // used for different borrow token in CDP
    // )
  } else {
    // createRepay(
    //     asset: Bytes
    //     account: Bytes
    //     amount: BigInt
    //     amountUSD: BigDecimal
    //     newBalance: BigInt
    //     tokenPriceUSD: BigDecimal // used for different borrow token in CDP
    // )
  }

  // createLiquidate(
  //     asset: Bytes
  //     liquidator: Address
  //     liquidatee: Address
  //     amount: BigInt
  //     amountUSD: BigDecimal
  //     profitUSD: BigDecimal
  //     newBalance: BigInt // repaid token balance for liquidatee
  // )

  // createTransfer(
  //     asset: Bytes
  //     sender: Address
  //     receiver: Address
  //     amount: BigInt
  //     amountUSD: BigDecimal
  //     senderNewBalance: BigInt
  //     receiverNewBalance: BigInt
  // )
}
