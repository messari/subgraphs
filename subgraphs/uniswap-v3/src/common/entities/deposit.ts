// Create a deposit from a Mint event from a particular pool contract.
import { Bytes } from "@graphprotocol/graph-ts";
import { _HelperStore } from "../../../generated/schema";
import { INT_ONE } from "../constants";

// Update store that tracks the deposit count per pool
export function incrementDepositHelper(pool: Bytes): void {
  const poolDeposits = _HelperStore.load(pool)!;
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE;
  poolDeposits.save();
}
