import { ethereum, Address } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { ZERO_BIGDECIMAL } from "../helpers/constants";
import { getOrCreateYieldAggregator } from "./initializers";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateYieldAggregator();

  let vaults = protocol.vaults;

  vaults.push(vaultAddress.toHexString());
  protocol.vaults = vaults;
  protocol.totalPoolCount += 1;

  protocol.save();
}

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateYieldAggregator();
  const vaultIds = protocol.vaults;

  let totalValueLockedUSD = ZERO_BIGDECIMAL;
  for (let vaultIdx = 0; vaultIdx < vaultIds.length; vaultIdx++) {
    const vault = Vault.load(vaultIds[vaultIdx]);

    if (!vault) continue;
    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}