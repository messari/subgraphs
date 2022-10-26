import { ethereum, Address, log, json, JSONValue } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, ZERO_BIGDECIMAL } from "../helpers/constants";
import { getOrCreateYieldAggregator } from "./initializers";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateYieldAggregator(vaultAddress);

  let vaultIds = protocol._vaultIds;
  vaultIds.push(vaultAddress.toHexString())

  protocol._vaultIds = vaultIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}

export function updateProtocolTotalValueLockedUSD(contractAddress: Address): void {
  const protocol = getOrCreateYieldAggregator(contractAddress);
  const vaultIds = protocol._vaultIds;

  let totalValueLockedUSD = ZERO_BIGDECIMAL;
  for (let vaultIdx = 0; vaultIdx < vaultIds.length; vaultIdx++) {
    const vault = Vault.load(vaultIds[vaultIdx]);

    if (!vault) continue;
    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}