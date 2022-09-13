import {
  Burn,
  Mint,
  VariableDebtToken,
} from "../../../../generated/templates/VariableDebtToken/VariableDebtToken";
import { rayMul } from "../../../../src/utils/numbers";
import { getMarketById } from "../entities/market";
import { updateUserVariableBorrowerPosition } from "../entities/position";
import {
  getReserve,
  updateReserveVariableDebtSupply,
} from "../entities/reserve";

export function handleBurn(event: Burn): void {
  const contract = VariableDebtToken.bind(event.address);
  const result = contract.getScaledUserBalanceAndSupply(event.params.from);
  const scaledTotalSupply = result.value1;
  updateReserveVariableDebtSupply(event, scaledTotalSupply, event.params.index);

  const userBalance = rayMul(result.value0, event.params.index);
  const reserve = getReserve(event.address);
  updateUserVariableBorrowerPosition(
    event,
    event.params.from,
    getMarketById(reserve.id),
    userBalance
  );
}

export function handleMint(event: Mint): void {
  const contract = VariableDebtToken.bind(event.address);
  const result = contract.getScaledUserBalanceAndSupply(
    event.params.onBehalfOf
  );
  const scaledTotalSupply = result.value1;
  updateReserveVariableDebtSupply(event, scaledTotalSupply, event.params.index);

  const userBalance = rayMul(result.value0, event.params.index);
  const reserve = getReserve(event.address);
  updateUserVariableBorrowerPosition(
    event,
    event.params.onBehalfOf,
    getMarketById(reserve.id),
    userBalance
  );
}
