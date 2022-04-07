import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Chainlink } from "../../generated/beltBTC/Chainlink";
import { Vault as VaultContract } from "../../generated/beltBTC/Vault";
import { Token, Vault } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, BSC_CHAINLINK_PRICE_ADDRESS } from "../constant";
import { readValue } from "../utils/contracts";

export function getUSDPriceOfToken(token: Token): BigDecimal {
  let tokenAddress = Address.fromString(token.id);
  let tokenDecimals = BigInt.fromI32(10).pow(token.decimals as u8);
  let chainlinkAddress = Address.fromString(BSC_CHAINLINK_PRICE_ADDRESS);

  const chainlink = Chainlink.bind(chainlinkAddress);
  let result = chainlink.try_getChainLinkPrice(tokenAddress);

  if (result.reverted) {
    return BIGDECIMAL_ZERO;
  }

  let value = result.value.value0;
  return value.toBigDecimal().div(tokenDecimals.toBigDecimal());
}

export function getUSDPriceOfOutputToken(vault: Vault, inputToken: Token): BigDecimal {
  let tokenPrice = getUSDPriceOfToken(inputToken);
  let tokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);

  let vaultContract = VaultContract.bind(Address.fromString(vault.id));
  let pricePerShare = readValue<BigInt>(vaultContract.try_getPricePerFullShare(), BIGINT_ZERO);

  let ratio = BigDecimal.fromString(pricePerShare.toString()).div(tokenDecimals.toBigDecimal());
  return tokenPrice.times(ratio);
}
