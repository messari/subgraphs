import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { YearnLensContract } from "../../../generated/ibALPACA/YearnLensContract";

export function getYearnLensContract(
  contractAddress: Address
): YearnLensContract | null {
  if (utils.isNullAddress(contractAddress)) return null;

  return YearnLensContract.bind(contractAddress);
}

export function getTokenPriceUSDC(tokenAddr: Address): CustomPriceType {
  const config = utils.getConfig();

  if (!config || config.yearnLensBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const yearnLensContract = getYearnLensContract(config.yearnLens());
  if (!yearnLensContract) return new CustomPriceType();

  const tokenPrice: BigDecimal = utils
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
