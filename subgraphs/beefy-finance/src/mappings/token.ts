import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/ExampleVault/ERC20";
import { BIGINT_ZERO } from "../prices/common/constants";
import { getUsdPricePerToken } from "../prices/index";
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
  log.warning("preso il token " + token.id, []);
  const price = getUsdPricePerToken(tokenAddress);
  log.warning("preso il prezzo", []);
  token.lastPriceUSD = price.usdPrice;
  log.warning("preso il prezzo USD", []);
  if (blockNumber != BIGINT_ZERO) {
    token.lastPriceBlockNumber = blockNumber;
    log.warning("preso il blockNumber", []);
  }
  token.save();
  log.warning("salvato", []);
  return price.usdPrice;
}
