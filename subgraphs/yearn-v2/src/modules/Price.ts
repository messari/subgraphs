import {
  BigInt,
  Address,
  BigDecimal,
  dataSource,
} from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Vault } from "../../generated/templates/Vault/Vault";
import { getPriceUsdcRecommended } from "../Prices/routers/CurveRouter";

export function getPriceOfOutputTokens(
  vaultAddress: Address,
  tokenAddress: Address,
  _decimals: BigDecimal
): BigDecimal {
  const network = dataSource.network();
  const vaultContract = Vault.bind(vaultAddress);

  const pricePerShare = utils.readValue<BigInt>(
    vaultContract.try_pricePerShare(),
    constants.BIGINT_ZERO
  );

  const virtualPrice = getPriceUsdcRecommended(tokenAddress, network);

  return pricePerShare
    .toBigDecimal()
    .div(_decimals)
    .times(virtualPrice.usdPrice)
    .div(constants.USDC_DENOMINATOR);
}
