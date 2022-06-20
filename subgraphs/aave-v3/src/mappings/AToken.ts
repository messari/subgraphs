import { Burn, Mint } from "../../generated/templates/AToken/AToken";
import { updateReserveATokenSupply } from "../entities/reserve";
import { BIGINT_ZERO } from "../utils/constants";
import { rayDiv } from "../utils/numbers";

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
