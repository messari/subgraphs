import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { AaveOracleContract } from "../../../generated/templates/PoolTemplate/AaveOracleContract";

export function getAaveOracleContract(
  contractAddress: Address
): AaveOracleContract | null {
  if (utils.isNullAddress(contractAddress)) return null;

  return AaveOracleContract.bind(contractAddress);
}

export function getTokenPriceUSDC(tokenAddr: Address): CustomPriceType {
  const config = utils.getConfig();

  if (!config || config.aaveOracleBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const aaveOracleContract = getAaveOracleContract(config.aaveOracle());
  if (!aaveOracleContract) return new CustomPriceType();

  const tokenPrice: BigDecimal = utils
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
