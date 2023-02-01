import { Address, dataSource } from "@graphprotocol/graph-ts";
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
import { getUpdateBlock } from "../utils/constants";

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
  
  // Interpret value based on current block compared to V3 -> V3.0.1 contract upgrade for that market
  // Event update: https://github.com/aave/aave-v3-core/pull/682
  let balanceTransferValue = event.params.value;
  const network = dataSource.network();
  const v301UpdateBlock = getUpdateBlock(network);
  if (v301UpdateBlock !== -1 && event.block.number.toU32() > v301UpdateBlock) {
    balanceTransferValue = balanceTransferValue.times(event.params.index);
  }

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
    updateUserLenderPosition(
      event,
      event.params.from,
      getMarket(marketAddress),
      contract.balanceOf(event.params.from)
    );
    createWithdraw(
      event,
      marketAddress,
      event.params.from,
      event.params.value,
      true
    );
    updateUserLenderPosition(
      event,
      event.params.to,
      getMarket(marketAddress),
      contract.balanceOf(event.params.to)
    );
    createDeposit(
      event,
      marketAddress,
      event.params.to,
      event.params.value,
      true
    );
  }
}
