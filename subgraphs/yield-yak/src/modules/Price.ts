import {
  BigInt,
  Address,
  BigDecimal,
  dataSource,
} from "@graphprotocol/graph-ts";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import * as utils from "../common/utils";
import { DEFUALT_AMOUNT } from "../helpers/constants";
import { BIGINT_ZERO } from "../Prices/common/constants";
import { getPriceUsdcRecommended } from "../Prices/routers/CurveRouter";

export function getPriceOfOutputTokens(
  contractAddress: Address,
  tokenAddress: Address,
  _decimals: BigDecimal
): BigDecimal {
  const strategyContract = YakStrategyV2.bind(contractAddress);

  let pricePerShare = utils.readValue<BigInt>(
    strategyContract.try_getSharesForDepositTokens(DEFUALT_AMOUNT),
    BIGINT_ZERO
  );

  const network = dataSource.network();
  let virtualPrice = getPriceUsdcRecommended(tokenAddress, network);

  return pricePerShare
    .toBigDecimal()
    .div(_decimals)
    .times(virtualPrice.usdPrice)
    .div(virtualPrice.decimalsBaseTen);
}
