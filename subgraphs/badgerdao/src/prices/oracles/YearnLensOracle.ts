import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { YearnLensContract } from "../../../generated/templates/Strategy/YearnLensContract";

export function getTokenPriceUSDC(
  tokenAddr: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  const config = utils.getConfig();
  const contractAddress = utils.getContract(config.yearnLens(), block);

  if (!contractAddress || config.yearnLensBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const yearnLensContract = YearnLensContract.bind(contractAddress);
  const tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      yearnLensContract.try_getPriceUsdcRecommended(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(
    tokenPrice,
    constants.DEFAULT_USDC_DECIMALS,
    constants.OracleType.YEARN_LENS_ORACLE
  );
}
