import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { AaveOracleContract } from "../../../generated/templates/MlpManagerTemplate/AaveOracleContract";

export function getTokenPriceUSDC(
  tokenAddr: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  const config = utils.getConfig();
  const contractAddress = utils.getContract(config.aaveOracle(), block);

  if (!contractAddress || config.aaveOracleBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const aaveOracleContract = AaveOracleContract.bind(contractAddress);

  const tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      aaveOracleContract.try_getAssetPrice(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(
    tokenPrice,
    constants.DEFAULT_AAVE_ORACLE_DECIMALS,
    constants.OracleType.AAVE_ORACLE
  );
}
