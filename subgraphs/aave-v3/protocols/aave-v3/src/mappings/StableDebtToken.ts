import {
  Burn,
  Mint,
} from "../../../../generated/templates/StableDebtToken/StableDebtToken";
import { updateReserveStableDebtSupply } from "../entities/reserve";

export function handleBurn(event: Burn): void {
  updateReserveStableDebtSupply(event, event.params.newTotalSupply);
}

export function handleMint(event: Mint): void {
  updateReserveStableDebtSupply(event, event.params.newTotalSupply);
}
