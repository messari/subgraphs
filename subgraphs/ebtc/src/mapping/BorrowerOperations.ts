import { Address } from "@graphprotocol/graph-ts";
import { CdpUpdated } from "../../generated/BorrowerOperations/BorrowerOperations";
import { FlashLoanSuccess } from "../../generated/ActivePool/ActivePool";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { BIGINT_TEN_TO_EIGHTEENTH, BIGINT_ZERO } from "../sdk/util/constants";
import { EBTC_ADDRESS, getDataManager, STETH_ADDRESS } from "../constants";

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
  }
  if (deltaColl < BIGINT_ZERO) {
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

  // TODO: ebtc price can be determined as below (via price lib), but it might
  // be better to not take market price but use theoretical price instead.
  const deltaDebt = event.params._debt.minus(event.params._oldDebt);
  if (deltaDebt > BIGINT_ZERO) {
    dataManager.createBorrow(
      EBTC_ADDRESS, // asset: Bytes
      event.params._borrower, // account: Bytes
      deltaDebt, // amount: BigInt
      getUsdPrice(
        Address.fromBytes(EBTC_ADDRESS),
        deltaColl.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal(),
        event.block
      ), // amountUSD: BigDecimal
      event.params._debt, // newBalance: BigInt
      getUsdPricePerToken(Address.fromBytes(EBTC_ADDRESS)).usdPrice // tokenPriceUSD: BigDecimal // used for different borrow token in CDP
    );
  }
  if (deltaDebt < BIGINT_ZERO) {
    dataManager.createRepay(
      EBTC_ADDRESS, // asset: Bytes
      event.params._borrower, // account: Bytes
      deltaDebt, // amount: BigInt
      getUsdPrice(
        Address.fromBytes(EBTC_ADDRESS),
        deltaColl.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal(),
        event.block
      ), // amountUSD: BigDecimal
      event.params._coll, // newBalance: BigInt
      getUsdPricePerToken(Address.fromBytes(EBTC_ADDRESS)).usdPrice // tokenPriceUSD: BigDecimal // used for different borrow token in CDP
    );
  }
}

/**
 * Create a flashloan object and handle its fee when a flashloan is successful.
 * @param event FlashLoanSuccess The event emitted by BorrowerOperations when
 * a flashloan is successful.
 */
export function handleFlashLoanSuccess(event: FlashLoanSuccess): void {
  // TODO: this is a dupe of the same function in ActivePool.ts
  // TODO: how to export imported functions?
  const dataManager = getDataManager(event);
  dataManager.createFlashloan(
    Address.fromBytes(STETH_ADDRESS), // asset: Address
    event.params._receiver, // account: Address
    event.params._amount, // amount: BigInt
    getUsdPrice(
      Address.fromBytes(STETH_ADDRESS),
      event.params._amount.div(BIGINT_TEN_TO_EIGHTEENTH).toBigDecimal(),
      event.block
    ) // amountUSD: BigDecimal
  );
  // TODO: handle fee (event.params._fee)
}
