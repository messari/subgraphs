import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { AaveOracleContract } from "../../../generated/templates/PoolTemplate/AaveOracleContract";

export function getAaveOracleContract(): AaveOracleContract | null {
  let config = utils.getConfig();
  if (!config || utils.isNullAddress(config.aaveOracle())) return null;

  return AaveOracleContract.bind(config.aaveOracle());
}

export function getTokenPriceFromAaveOracle(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  const aaveOracleContract = getAaveOracleContract();

  if (!aaveOracleContract) {
    return new CustomPriceType();
  }

  let tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      aaveOracleContract.try_getAssetPrice(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(
    tokenPrice,
    constants.DEFAULT_USDC_DECIMALS
  );
}
