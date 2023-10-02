import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { CalculationsSushiSwap as CalculationsSushiContract } from "../../../generated/Pool/CalculationsSushiSwap";

export function getTokenPriceUSDC(
  tokenAddr: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  const config = utils.getConfig();
  const contractAddress = utils.getContract(config.sushiCalculations(), block);

  if (
    !contractAddress ||
    config.sushiCalculationsBlacklist().includes(tokenAddr)
  )
    return new CustomPriceType();

  const curveContract = CalculationsSushiContract.bind(contractAddress);

  const tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      curveContract.try_getPriceUsdc(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(
    tokenPrice,
    constants.DEFAULT_USDC_DECIMALS,
    constants.OracleType.SUSHI_CALCULATIONS
  );
}
