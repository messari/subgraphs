import { Address } from "@graphprotocol/graph-ts";
import {
  BalanceTransfer,
  Burn,
  Mint,
} from "../../../../generated/templates/AToken/AToken";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { rayDiv } from "../../../../src/utils/numbers";
import { createDeposit, createWithdraw } from "../entities/event";
import {
  addMarketProtocolSideRevenue,
  getMarket,
  getMarketById,
} from "../entities/market";
import { updateUserLenderPosition } from "../entities/position";
import { amountInUSD } from "../entities/price";
import { getReserve, updateReserveATokenSupply } from "../entities/reserve";
import { getTokenById } from "../entities/token";

export function handleBurn(event: Burn): void {
  const amount = event.params.value.plus(event.params.balanceIncrease);
  const scaledAmount = rayDiv(amount, event.params.index);
  updateReserveATokenSupply(
    event,
    BIGINT_ZERO.minus(scaledAmount),
    event.params.index
  );

  const reserve = getReserve(event.address);
  updateUserLenderPosition(
    event,
    event.params.from,
    getMarketById(reserve.id),
    BIGINT_ZERO.minus(scaledAmount),
    event.params.index
  );
}

export function handleMint(event: Mint): void {
  const amount = event.params.value.minus(event.params.balanceIncrease);
  const scaledAmount = rayDiv(amount, event.params.index);
  updateReserveATokenSupply(event, scaledAmount, event.params.index);

  const reserve = getReserve(event.address);
  updateUserLenderPosition(
    event,
    event.params.onBehalfOf,
    getMarketById(reserve.id),
    scaledAmount,
    event.params.index
  );
}

export function handleBalanceTransfer(event: BalanceTransfer): void {
  const reserve = getReserve(event.address);
  // Liquidation protocol fee gets transferred directly to treasury during liquidation (if activated)
  if (reserve.treasuryAddress == event.params.to.toHexString()) {
    const valueUSD = amountInUSD(event.params.value, getTokenById(reserve.id));
    addMarketProtocolSideRevenue(event, getMarketById(reserve.id), valueUSD);
  } else {
    if (event.params.value.equals(BIGINT_ZERO)) {
      return;
    }
    const scaledAmount = rayDiv(event.params.value, event.params.index);
    const marketAddress = Address.fromString(reserve.id);
    // Handle transfer as withdraw + deposit
    createWithdraw(event, marketAddress, event.params.from, event.params.value);
    updateUserLenderPosition(
      event,
      event.params.from,
      getMarket(marketAddress),
      BIGINT_ZERO.minus(scaledAmount),
      event.params.index
    );
    createDeposit(event, marketAddress, event.params.to, event.params.value);
    updateUserLenderPosition(
      event,
      event.params.to,
      getMarket(marketAddress),
      scaledAmount,
      event.params.index
    );
  }
}
