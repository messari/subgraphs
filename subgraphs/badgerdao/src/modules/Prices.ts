import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { BigInt, Address, BigDecimal } from "@graphprotocol/graph-ts";
import { getPriceUsdcRecommended } from "../Prices/routers/CurveRouter";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

export function getPricePerShare(vaultAddress: Address): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);

  const pricePerShare = utils
    .readValue<BigInt>(
      vaultContract.try_getPricePerFullShare(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return pricePerShare;
}

export function getPriceOfOutputTokens(
  vaultAddress: Address,
  amount: BigInt
): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);

  const tokenAddress = utils.readValue<Address>(
    vaultContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );

  const virtualPrice = getPriceUsdcRecommended(tokenAddress);
  const vaultTokenDecimals = utils.getTokenDecimals(vaultAddress);
  const pricePerShare = getPricePerShare(vaultAddress);

  const price = pricePerShare
    .times(amount.toBigDecimal())
    .div(vaultTokenDecimals)
    .div(vaultTokenDecimals)
    .times(virtualPrice.usdPrice)
    .div(virtualPrice.decimalsBaseTen);

  return price;
}
