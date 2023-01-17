import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { AaveOracleContract } from "../../../generated/YakStrategyV2/AaveOracleContract";
import { AAVE_ORACLE_CONTRACT_ADDRESS } from "../config/avalanche";

export function getAaveOracleContract(
  contractAddress: Address
): AaveOracleContract | null {
  if (utils.isNullAddress(contractAddress)) return null;

  return AaveOracleContract.bind(contractAddress);
}

export function getTokenPriceUSDC(tokenAddr: Address): CustomPriceType {
  const aaveOracleContract = getAaveOracleContract(AAVE_ORACLE_CONTRACT_ADDRESS);
  if (!aaveOracleContract) return new CustomPriceType();

  const tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      aaveOracleContract.try_getAssetPrice(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(tokenPrice, constants.AAVE_ORACLE_DECIMALS);
}
