import { Address, log } from "@graphprotocol/graph-ts";
import { Liquidated } from "../../generated/Liquidator/Liquidator2";
import { createLiquidate } from "../entities/event";
import { LoanToken } from "../../generated/templates/LoanToken/LoanToken";
import { TRU_ADDRESS } from "../utils/constants";

export function handleLiquidated(event: Liquidated): void {
  log.warning("Liquidated: {}", [event.params.defaultedValue.toHexString()]);
}
