import { Burn, Mint, BalanceTransfer } from "../../generated/templates/GToken/GToken";

import {
  addMarketProtocolSideRevenue,
  getMarketById,
} from "../common/market";
import { rayDiv } from "../common/utils/numbers";
import { amountInUSD } from "../common/price";
import { getTokenById } from "../common/token";
import { BIGINT_ZERO } from "../common/utils/constants";
import { getReserve, updateReserveATokenSupply } from "../common/reserve";


export function handleBurn(event: Burn): void {
  let amount = event.params.value;
  amount = rayDiv(amount, event.params.index);
  updateReserveATokenSupply(
    event,
    BIGINT_ZERO.minus(amount),
    event.params.index
  );
}

export function handleMint(event: Mint): void {
  let amount = event.params.value;
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
