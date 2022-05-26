import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/ExampleVault/ERC20";
import { BIGINT_ZERO } from "../prices/common/constants";
import { getTokenPriceFromChainLink } from "../prices/oracles/ChainLinkFeed";
import { getTokenOrCreate } from "../utils/getters";

export function fetchTokenDecimals(tokenAddress: Address): number {
  const tokenContract = ERC20.bind(tokenAddress);
  return tokenContract.decimals();
}

export function fetchTokenName(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  return tokenContract.name();
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  return tokenContract.symbol();
}

export function getLastPriceUSD(
  tokenAddress: Address,
  blockNumber: BigInt = BIGINT_ZERO
): BigDecimal {
  const token = getTokenOrCreate(tokenAddress, "-137");
  const price = getTokenPriceFromChainLink(tokenAddress, "matic");
  token.lastPriceUSD = price.usdPrice;
  if (blockNumber != BIGINT_ZERO) {
    token.lastPriceBlockNumber = blockNumber;
  }
  token.save();
  return price.usdPrice;
}
