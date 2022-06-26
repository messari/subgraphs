import {
  Burn,
  Mint,
} from "../../../../generated/templates/VariableDebtToken/VariableDebtToken";
import { updateReserveVariableDebtSupply } from "../entities/reserve";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import { rayDiv } from "../../../../src/utils/numbers";

export function handleBurn(event: Burn): void {
  let amount = event.params.value.plus(event.params.balanceIncrease);
  amount = rayDiv(amount, event.params.index);
  updateReserveVariableDebtSupply(
    event,
    BIGINT_ZERO.minus(amount),
    event.params.index
  );
}

export function handleMint(event: Mint): void {
  let amount = event.params.value.minus(event.params.balanceIncrease);
  amount = rayDiv(amount, event.params.index);
  updateReserveVariableDebtSupply(event, amount, event.params.index);
}
