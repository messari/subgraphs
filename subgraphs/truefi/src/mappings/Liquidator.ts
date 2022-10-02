import { Address } from "@graphprotocol/graph-ts";
import { Liquidated } from "../../generated/Liquidator/Liquidator2";
import { createLiquidate } from "../entities/event";
import { LoanToken } from "../../generated/templates/LoanToken/LoanToken";
import { TRU_ADDRESS } from "../utils/constants";

export function handleLiquidated(event: Liquidated): void {
  const contract = LoanToken.bind(event.address);
  const tokenResult = contract.try_token();
  if (tokenResult.reverted) {
    return;
  }
  const token = tokenResult.value;
  const borrowerResult = contract.try_borrower();
  if (borrowerResult.reverted) {
    return;
  }
  const borrower = borrowerResult.value;

  createLiquidate(
    event,
    Address.fromString(TRU_ADDRESS),
    event.params.withdrawnTru,
    token,
    event.params.defaultedValue,
    event.address,
    borrower
  );
}
