import {
  BigInt,
  Address,
  BigDecimal,
  dataSource,
} from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getPriceUsdcRecommended } from "../Prices/routers/CurveRouter";
import { Pool as VaultContract } from "../../generated/templates/PoolRewards/Pool";

export function getPriceOfOutputTokens(
  vaultAddress: Address,
  amount: BigInt
): BigDecimal {
  const network = dataSource.network();
  const vaultContract = VaultContract.bind(vaultAddress);

  let pricePerShare = utils.readValue<BigInt>(
    vaultContract.try_pricePerShare(),
    constants.BIGINT_ZERO
  );

  if (pricePerShare.equals(constants.BIGINT_ZERO)) {
    pricePerShare = utils.readValue<BigInt>(
      vaultContract.try_getPricePerShare(),
      constants.BIGINT_ZERO
    );
  }

  const tokenAddress = utils.readValue<Address>(
    vaultContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );

  let virtualPrice = getPriceUsdcRecommended(tokenAddress, network);
  let vaultTokenDecimals = utils.getTokenDecimals(vaultAddress);

  let price = pricePerShare
    .toBigDecimal()
    .times(amount.toBigDecimal())
    .div(vaultTokenDecimals)
    .div(vaultTokenDecimals)
    .times(virtualPrice.usdPrice)
    .div(virtualPrice.decimalsBaseTen);

  return price;
}
