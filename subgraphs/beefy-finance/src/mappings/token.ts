import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/ExampleVault/ERC20";
import { getUsdPricePerToken } from "../prices";
import { BIGINT_ZERO } from "../prices/common/constants";
import { getTokenOrCreate } from "../utils/getters";

export function fetchTokenDecimals(tokenAddress: Address): number {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_decimals();
  if (call.reverted) {
    return 0;
  } else {
    return call.value;
  }
}

export function fetchTokenName(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_name();
  if (call.reverted) {
    return tokenAddress.toHexString();
  } else {
    return call.value;
  }
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_symbol();
  if (call.reverted) {
    return " ";
  } else {
    return call.value;
  }
}

export function getLastPriceUSD(
  tokenAddress: Address,
  networkSuffix: string,
  blockNumber: BigInt = BIGINT_ZERO
): BigDecimal {
  const token = getTokenOrCreate(tokenAddress, networkSuffix);
  const price = getUsdPricePerToken(tokenAddress);
  token.lastPriceUSD = price.usdPrice;
  if (blockNumber != BIGINT_ZERO) {
    token.lastPriceBlockNumber = blockNumber;
  }
  token.save();
  return price.usdPrice;
}
