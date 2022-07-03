import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { YearnLensContract } from "../../../../../generated/templates/CTokenModified/YearnLensContract";

export function getYearnLensContract(network: string): YearnLensContract {
  return YearnLensContract.bind(
    Address.fromString(constants.YEARN_LENS_CONTRACT_ADDRESS.get(network))
  );
}

export function getTokenPriceFromYearnLens(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  const yearnLensContract = getYearnLensContract(network);

  if (!yearnLensContract) {
    return new CustomPriceType();
  }

  let tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      yearnLensContract.try_getPriceUsdcRecommended(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(
    tokenPrice,
    constants.DEFAULT_USDC_DECIMALS
  );
}
