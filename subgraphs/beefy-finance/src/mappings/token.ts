import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/ExampleVault/ERC20";
import { getUsdPricePerToken } from "../prices";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../prices/common/constants";
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
  blockNumber: BigInt = BIGINT_ZERO
): BigDecimal {
  log.warning("getLastPriceUSD", []);
  const token = getTokenOrCreate(tokenAddress);
  log.warning("tokenID", []);
  const price = getUsdPricePerToken(tokenAddress);
  log.warning("price", []);
  if (!price.reverted) {
    log.warning("price not reverted", []);
    token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
  } else {
    log.warning("price reverted", []);
    token.lastPriceUSD = BIGDECIMAL_ZERO;
  }

  if (blockNumber != BIGINT_ZERO) {
    log.warning("blockNumber not zero", []);
    token.lastPriceBlockNumber = blockNumber;
  }
  log.warning("save", []);
  token.save();
  return token.lastPriceUSD;
}
