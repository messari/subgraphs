import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { YakERC20 } from "../../generated/YakStrategyV2/YakERC20";
import { ZERO_BIGDECIMAL } from "../helpers/constants";
import { getOrCreateToken, getOrCreateYieldAggregator } from "./initializers";
import * as constants from "../helpers/constants";
import { getUsdPricePerToken } from "../Prices";

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

// Update token price and return token entity
export function updateTokenPrice(
  tokenAddress: Address,
  blockNumber: BigInt
): void {
  let token = getOrCreateToken(tokenAddress, blockNumber);
  if (blockNumber > token.lastPriceBlockNumber!) {
    let fetchPrice = getUsdPricePerToken(tokenAddress);
    token.lastPriceUSD = fetchPrice.usdPrice;
    token.lastPriceBlockNumber = blockNumber;
    token.save();
  }
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
