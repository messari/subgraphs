import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { YakERC20 } from "../../generated/YakStrategyV2/YakERC20";
import { ZERO_BIGDECIMAL } from "../helpers/constants";
import { getOrCreateYieldAggregator } from "./initializers";
import * as constants from "../helpers/constants";

export function updateProtocolAfterNewVault(vaultAddress: Address): void {
  const protocol = getOrCreateYieldAggregator();

  let vaultIds = protocol._vaultIds;
  vaultIds.push(vaultAddress.toHexString());

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

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
  const token = YakERC20.bind(tokenAddr);

  const tokenValue = readValue<i32>(token.try_decimals(), constants.ZERO_INT);

  return BigInt.fromI32(tokenValue);
}

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bigDecimal = BigDecimal.fromString("1");
  for (let i = 0; i < decimals; i++) {
    bigDecimal = bigDecimal.times(BigDecimal.fromString("10"));
  }
  return bigDecimal;
}
