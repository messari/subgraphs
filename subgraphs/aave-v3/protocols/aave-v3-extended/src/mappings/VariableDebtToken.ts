import {
  Burn,
  Mint,
} from "../../../../generated/templates/VariableDebtToken/VariableDebtToken";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { rayDiv } from "../../../../src/utils/numbers";
import { getMarketById } from "../entities/market";
import { updateUserBorrowerPosition } from "../entities/position";
import {
  getReserve,
  updateReserveVariableDebtSupply,
} from "../entities/reserve";

export function handleBurn(event: Burn): void {
  let amount = event.params.value.plus(event.params.balanceIncrease);
  amount = rayDiv(amount, event.params.index);
  updateReserveVariableDebtSupply(
    event,
    BIGINT_ZERO.minus(amount),
    event.params.index
  );

  const reserve = getReserve(event.address);
  updateUserBorrowerPosition(
    event,
    event.params.from,
    getMarketById(reserve.id),
    BIGINT_ZERO.minus(event.params.value)
  );
}

export function handleMint(event: Mint): void {
  let amount = event.params.value.minus(event.params.balanceIncrease);
  amount = rayDiv(amount, event.params.index);
  updateReserveVariableDebtSupply(event, amount, event.params.index);

  const reserve = getReserve(event.address);
  updateUserBorrowerPosition(
    event,
    event.params.onBehalfOf,
    getMarketById(reserve.id),
    event.params.value
  );
}
