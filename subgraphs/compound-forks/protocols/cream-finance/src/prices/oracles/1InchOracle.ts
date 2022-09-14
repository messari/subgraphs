import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { OneInchOracleContract } from "../../../../../generated/templates/CToken/OneInchOracleContract";

export function getOneInchOracleContract(
  network: string
): OneInchOracleContract {
  return OneInchOracleContract.bind(
    constants.ONE_INCH_ORACLE_CONTRACT_ADDRESS.get(network)
  );
}

export function getTokenPriceFromOneInch(
  tokenAddr: Address,
  network: string
): CustomPriceType {
  const oneInchOracleContract = getOneInchOracleContract(network);

  if (
    constants.ONE_INCH_ORACLE_CONTRACT_ADDRESS.get(network).equals(
      constants.ZERO_ADDRESS
    )
  ) {
    return new CustomPriceType();
  }

  if (!oneInchOracleContract) {
    return new CustomPriceType();
  }

  let tokenPrice: BigDecimal = utils
    .readValue<BigInt>(
      oneInchOracleContract.try_getRate(
        tokenAddr,
        constants.WHITELIST_TOKENS_MAP.get(network)!.get("USDC")!,
        true
      ),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  let tokenDecimals = utils.getTokenDecimals(tokenAddr);

  return CustomPriceType.initialize(
    tokenPrice.times(
      constants.BIGINT_TEN.pow(tokenDecimals.toI32() as u8).toBigDecimal()
    ),
    constants.DEFAULT_USDC_DECIMALS + constants.DEFAULT_DECIMALS.toI32()
  );
}
