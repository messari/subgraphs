import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ChainlinkOracle } from "../../generated/ExampleVault/ChainlinkOracle";
import { Token, Vault } from "../../generated/schema";
import { getAddressFromId } from "./helpers";

export function getUSDPrice(token: Token): BigDecimal {
  const tokenAddress = getAddressFromId(token.id);
  const oracle = ChainlinkOracle.bind(tokenAddress);
  const tokenDecimals = BigInt.fromI32(10).pow(token.decimals as u8);

  let result = oracle.try_getChainLinkPrice(tokenAddress);

  if (result.reverted) {
    return new BigDecimal(new BigInt(0));
  }

  let value = result.value.value0;
  const price = value.toBigDecimal().div(tokenDecimals.toBigDecimal());
  token.lastPriceUSD = price;
  token.save();
  return price;
}

export function getUSDPriceOfOutputToken(
  vault: Vault,
  inputToken: Token
): BigDecimal {
  let tokenPrice = getUSDPrice(inputToken);
  let tokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);

  let pricePerShare = vault.pricePerShare;

  let ratio = BigDecimal.fromString(pricePerShare.toString()).div(
    tokenDecimals.toBigDecimal()
  );
  return tokenPrice.times(ratio);
}

// export function getPriceForLPToken(lpToken: Token): BigDecimal {

//   return new BigDecimal(0);
// }
