import { log, ethereum } from "@graphprotocol/graph-ts";

export function readCallValue<T>(callResult: ethereum.CallResult<T>, defaultValue: T): T {
  if (callResult.reverted) {
    log.error("Call reverted. Returning default value", []);
    return defaultValue;
  }
  return callResult.value;
}
