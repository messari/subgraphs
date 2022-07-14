import {
  BalanceTransfer,
  Burn,
  Mint,
} from "../../../../generated/templates/AToken/AToken";
import {
  addMarketProtocolSideRevenue,
  getMarketById,
} from "../entities/market";
import { amountInUSD } from "../entities/price";
import { getReserve, updateReserveATokenSupply } from "../entities/reserve";
import { getTokenById } from "../entities/token";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { rayDiv } from "../../../../src/utils/numbers";

export function handleBurn(event: Burn): void {
  let amount = event.params.value.plus(event.params.balanceIncrease);
  amount = rayDiv(amount, event.params.index);
  updateReserveATokenSupply(
    event,
    BIGINT_ZERO.minus(amount),
    event.params.index
  );
}

export function handleMint(event: Mint): void {
  let amount = event.params.value.minus(event.params.balanceIncrease);
  amount = rayDiv(amount, event.params.index);
  updateReserveATokenSupply(event, amount, event.params.index);
}

export function handleBalanceTransfer(event: BalanceTransfer): void {
  const reserve = getReserve(event.address);
  // Liquidation protocol fee gets transferred directly to treasury during liquidation (if activated)
  if (reserve.treasuryAddress == event.params.to.toHexString()) {
    const valueUSD = amountInUSD(event.params.value, getTokenById(reserve.id));
    addMarketProtocolSideRevenue(event, getMarketById(reserve.id), valueUSD);
  }
}
