import {
  Burn,
  Mint,
} from "../../../../generated/templates/StableDebtToken/StableDebtToken";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { getMarketById } from "../entities/market";
import { updateUserBorrowerPosition } from "../entities/position";
import { getReserve, updateReserveStableDebtSupply } from "../entities/reserve";

export function handleBurn(event: Burn): void {
  updateReserveStableDebtSupply(event, event.params.newTotalSupply);

  const reserve = getReserve(event.address);
  updateUserBorrowerPosition(
    event,
    event.params.from,
    getMarketById(reserve.id),
    BIGINT_ZERO.minus(event.params.amount)
  );
}

export function handleMint(event: Mint): void {
  updateReserveStableDebtSupply(event, event.params.newTotalSupply);

  const reserve = getReserve(event.address);
  updateUserBorrowerPosition(
    event,
    event.params.onBehalfOf,
    getMarketById(reserve.id),
    event.params.amount
  );
}
