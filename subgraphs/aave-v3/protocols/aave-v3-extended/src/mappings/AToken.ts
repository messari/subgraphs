import { Address } from "@graphprotocol/graph-ts";
import {
  AToken,
  BalanceTransfer,
  Burn,
  Mint,
} from "../../../../generated/templates/AToken/AToken";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { rayMul } from "../../../../src/utils/numbers";
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
  const contract = AToken.bind(event.address);
  const result = contract.getScaledUserBalanceAndSupply(event.params.from);
  const scaledTotalSupply = result.value1;
  updateReserveATokenSupply(event, scaledTotalSupply, event.params.index);

  const userBalance = rayMul(result.value0, event.params.index);
  const reserve = getReserve(event.address);
  updateUserLenderPosition(
    event,
    event.params.from,
    getMarketById(reserve.id),
    userBalance
  );
}

export function handleMint(event: Mint): void {
  const contract = AToken.bind(event.address);
  const result = contract.getScaledUserBalanceAndSupply(
    event.params.onBehalfOf
  );
  const scaledTotalSupply = result.value1;
  updateReserveATokenSupply(event, scaledTotalSupply, event.params.index);

  const userBalance = rayMul(result.value0, event.params.index);
  const reserve = getReserve(event.address);
  updateUserLenderPosition(
    event,
    event.params.onBehalfOf,
    getMarketById(reserve.id),
    userBalance
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
    const contract = AToken.bind(event.address);
    const marketAddress = Address.fromString(reserve.id);
    // Handle transfer as withdraw + deposit
    createWithdraw(event, marketAddress, event.params.from, event.params.value);
    updateUserLenderPosition(
      event,
      event.params.from,
      getMarket(marketAddress),
      contract.balanceOf(event.params.from)
    );
    createDeposit(event, marketAddress, event.params.to, event.params.value);
    updateUserLenderPosition(
      event,
      event.params.to,
      getMarket(marketAddress),
      contract.balanceOf(event.params.to)
    );
  }
}
