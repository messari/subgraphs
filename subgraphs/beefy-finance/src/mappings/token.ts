import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/ExampleVault/ERC20";
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
  blockNumber?: BigInt
): BigDecimal {
  const token = getTokenOrCreate(tokenAddress, "-137");
  const price = getTokenPriceFromChainLink(tokenAddress, "137");
  token.lastPriceUSD = price.usdPrice;
  if (blockNumber) {
    token.lastPriceBlockNumber = blockNumber;
  }
  token.save();
  return price.usdPrice;
}
