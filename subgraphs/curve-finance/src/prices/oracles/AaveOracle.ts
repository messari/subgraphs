import { getUsdPricePerToken } from "..";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { AaveOracleContract } from "../../../generated/templates/PoolTemplate/AaveOracleContract";

export function getAaveUnderlyingAsset(tokenAddr: Address): Address {
  const aaveContract = AaveOracleContract.bind(tokenAddr);

  return utils.readValue<Address>(
    aaveContract.try_UNDERLYING_ASSET_ADDRESS(),
    constants.NULL.TYPE_ADDRESS
  );
}

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

  if (tokenPrice.equals(constants.BIGDECIMAL_ZERO)) {
    const aaveUnderlyingAsset = getAaveUnderlyingAsset(tokenAddr);

    if (aaveUnderlyingAsset.notEqual(constants.NULL.TYPE_ADDRESS))
      return getUsdPricePerToken(aaveUnderlyingAsset, block);

    return new CustomPriceType();
  }

  return CustomPriceType.initialize(
    tokenPrice,
    constants.DEFAULT_AAVE_ORACLE_DECIMALS,
    constants.OracleType.AAVE_ORACLE
  );
}
