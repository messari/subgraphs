import {
  BigInt,
  Address,
  BigDecimal,
  dataSource,
} from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getPriceUsdcRecommended } from "../prices/routers/CurveRouter";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

export function getPricePerShare(vaultAddress: Address): BigInt {
  const vaultContract = VaultContract.bind(vaultAddress);

  let pricePerShare = utils.readValue<BigInt>(
    vaultContract.try_getPricePerFullShare(),
    constants.BIGINT_ZERO
  );

  return pricePerShare;
}

export function getPriceOfOutputTokens(vaultAddress: Address): BigDecimal {
  const network = dataSource.network();
  const vaultContract = VaultContract.bind(vaultAddress);

  const pricePerShare = getPricePerShare(vaultAddress);

  const tokenAddress = utils.readValue<Address>(
    vaultContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );

  let virtualPrice = getPriceUsdcRecommended(tokenAddress, network);
  let inputTokenDecimals = utils.getTokenDecimals(tokenAddress);

  let price = pricePerShare
    .divDecimal(inputTokenDecimals)
    .times(virtualPrice.usdPrice)
    .div(virtualPrice.decimalsBaseTen);

  return price;
}
