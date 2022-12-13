import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { getPriceUsdcRecommended } from "../Prices/calculations/CalculationsSushiswap";

export function getPriceOfOutputTokens(
  vaultAddress: Address,
  tokenAddress: Address,
  _decimals: BigDecimal
): BigDecimal {
  const network = dataSource.network();
  const vaultContract = Vault.load(vaultAddress.toHexString());

  let pricePerShare = vaultContract!.pricePerShare!;

  let virtualPrice = getPriceUsdcRecommended(tokenAddress, network);

  return pricePerShare
    .div(_decimals)
    .times(virtualPrice.usdPrice)
    .div(virtualPrice.decimalsBaseTen);
}
