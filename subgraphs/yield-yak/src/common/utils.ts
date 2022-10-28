import { ethereum, Address, log, json, JSONValue } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { calculatePriceInUSD } from "../calculators/priceInUSDCalculator";
import { BIGDECIMAL_HUNDRED, DEFUALT_AMOUNT, ZERO_BIGDECIMAL } from "../helpers/constants";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import { getOrCreateYieldAggregator } from "./initializers";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateYieldAggregator();

  let vaultIds = protocol._vaultIds;
  vaultIds.push(vaultAddress.toHexString())

  protocol._vaultIds = vaultIds;

  protocol.totalPoolCount += 1;

  protocol.save();
}

export function updateProtocolTotalValueLockedUSD(): void {
  const protocol = getOrCreateYieldAggregator();
  const vaultIds = protocol._vaultIds;

  let totalValueLockedUSD = ZERO_BIGDECIMAL;
  for (let vaultIdx = 0; vaultIdx < vaultIds.length; vaultIdx++) {
    const vault = Vault.load(vaultIds[vaultIdx]);

    if (!vault) {
      continue;
    }

    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}