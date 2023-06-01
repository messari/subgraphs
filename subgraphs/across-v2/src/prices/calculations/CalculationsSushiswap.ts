import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType, OracleContract } from "../common/types";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { CalculationsSushiSwap as CalculationsSushiContract } from "../../../generated/SpokePool1/CalculationsSushiSwap";

export function getSushiSwapContract(
  contract: OracleContract,
  block: ethereum.Block | null = null
): CalculationsSushiContract | null {
  if (
    (block && contract.startBlock.gt(block.number)) ||
    utils.isNullAddress(contract.address)
  )
    return null;

  return CalculationsSushiContract.bind(contract.address);
}

export function getTokenPriceUSDC(
  tokenAddr: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  const config = utils.getConfig();

  if (!config || config.sushiCalculationsBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const calculationSushiContract = getSushiSwapContract(
    config.sushiCalculations(),
    block
  );
  if (!calculationSushiContract) return new CustomPriceType();

  const tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      calculationSushiContract.try_getPriceUsdc(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(
    tokenPrice,
    constants.DEFAULT_USDC_DECIMALS,
    constants.OracleType.SUSHI_CALCULATIONS
  );
}
