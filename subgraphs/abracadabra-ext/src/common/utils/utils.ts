import { ethereum } from "@graphprotocol/graph-ts";

export function readValue<T>(callResult: ethereum.CallResult<T>, defaultValue: T): T {
  return callResult.reverted ? defaultValue : callResult.value;
}
