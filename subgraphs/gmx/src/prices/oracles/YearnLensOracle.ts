import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType, OracleContract } from "../common/types";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { YearnLensContract } from "../../../generated/Vault/YearnLensContract";

export function getYearnLensContract(
  contract: OracleContract,
  block: ethereum.Block
): YearnLensContract | null {
  if (
    contract.startBlock.gt(block.number) ||
    utils.isNullAddress(contract.address)
  )
    return null;

  return YearnLensContract.bind(contract.address);
}

export function getTokenPriceUSDC(
  tokenAddr: Address,
  block: ethereum.Block
): CustomPriceType {
  const config = utils.getConfig();

  if (!config || config.yearnLensBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const yearnLensContract = getYearnLensContract(config.yearnLens(), block);
  if (!yearnLensContract) return new CustomPriceType();

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
