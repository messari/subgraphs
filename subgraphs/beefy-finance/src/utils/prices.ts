import { BigDecimal, log } from "@graphprotocol/graph-ts";
import { Token, Vault } from "../../generated/schema";
import { getUsdPricePerToken } from "../prices";
import { getAddressFromId } from "./helpers";

export function getUSDPrice(token: Token): BigDecimal {
  const tokenAddress = getAddressFromId(token.id);
  const customPrice = getUsdPricePerToken(tokenAddress);
  const price = customPrice.usdPrice.div(customPrice.decimalsBaseTen);
  log.warning("updated", [token.id, price.toString()]);
  token.lastPriceUSD = price;
  token.save();
  return price;
}

export function getUSDPriceOfOutputToken(
  vault: Vault,
  inputToken: Token
): BigDecimal {
  const tokenPrice = getUSDPrice(inputToken);
  const pricePerShare = new BigDecimal(vault.pricePerShare);
  return tokenPrice.times(pricePerShare);
}
