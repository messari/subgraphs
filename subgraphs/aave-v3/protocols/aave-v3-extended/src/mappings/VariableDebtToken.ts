import {
  Burn,
  Mint,
} from "../../../../generated/templates/VariableDebtToken/VariableDebtToken";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { rayDiv } from "../../../../src/utils/numbers";
import { getMarketById } from "../entities/market";
import { updateUserVariableBorrowerPosition } from "../entities/position";
import {
  getReserve,
  updateReserveVariableDebtSupply,
} from "../entities/reserve";

export function handleBurn(event: Burn): void {
  const amount = event.params.value.plus(event.params.balanceIncrease);
  const scaledAmount = rayDiv(amount, event.params.index);
  updateReserveVariableDebtSupply(
    event,
    BIGINT_ZERO.minus(scaledAmount),
    event.params.index
  );

  const reserve = getReserve(event.address);
  updateUserVariableBorrowerPosition(
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
  updateReserveVariableDebtSupply(event, scaledAmount, event.params.index);

  const reserve = getReserve(event.address);
  updateUserVariableBorrowerPosition(
    event,
    event.params.onBehalfOf,
    getMarketById(reserve.id),
    scaledAmount,
    event.params.index
  );
}
