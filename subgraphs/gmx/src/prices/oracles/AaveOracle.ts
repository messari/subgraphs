import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType, OracleContract } from "../common/types";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { AaveOracleContract } from "../../../generated/Vault/AaveOracleContract";

export function getAaveOracleContract(
  contract: OracleContract,
  block: ethereum.Block
): AaveOracleContract | null {
  if (
    contract.startBlock.gt(block.number) ||
    utils.isNullAddress(contract.address)
  )
    return null;

  return AaveOracleContract.bind(contract.address);
}

export function getTokenPriceUSDC(
  tokenAddr: Address,
  block: ethereum.Block
): CustomPriceType {
  const config = utils.getConfig();

  if (!config || config.aaveOracleBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const aaveOracleContract = getAaveOracleContract(config.aaveOracle(), block);
  if (!aaveOracleContract) return new CustomPriceType();

  const tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      aaveOracleContract.try_getAssetPrice(tokenAddr),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return CustomPriceType.initialize(
    tokenPrice,
    constants.AAVE_ORACLE_DECIMALS,
    constants.OracleType.AAVE_ORACLE
  );
}
