import * as utils from "../common/utils";
import { getUsdPricePerToken } from "..";
import * as constants from "../common/constants";
import { CustomPriceType } from "../common/types";
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { InchOracleContract } from "../../../generated/templates/MlpManagerTemplate/InchOracleContract";

export function getTokenPriceUSDC(
  tokenAddr: Address,
  block: ethereum.Block | null = null
): CustomPriceType {
  const config = utils.getConfig();
  const contractAddress = utils.getContract(config.inchOracle(), block);

  if (!contractAddress || config.inchOracleBlacklist().includes(tokenAddr))
    return new CustomPriceType();

  const srcTokenDecimals = utils.getTokenDecimals(tokenAddr);
  const inchOracleContract = InchOracleContract.bind(contractAddress);

  for (let i = 0; i < constants.STABLE_TOKENS.length; i++) {
    const dstToken = config
      .whitelistedTokens()
      .mustGet(constants.STABLE_TOKENS[i]);

    let tokenPrice: BigDecimal = utils
      .readValue<BigInt>(
        inchOracleContract.try_getRate(tokenAddr, dstToken.address, true),
        constants.BIGINT_ZERO
      )
      .toBigDecimal();
    if (
      tokenAddr.equals(
        Address.fromString("0x62edc0692bd897d2295872a9ffcac5425011c661")
      )
    ) {
      log.warning(
        "[InchOracleGetPrice] tokenPrice {} tokenAddress {} stableTokenAddress {} ",
        [
          tokenPrice.toString(),
          tokenAddr.toHexString(),
          dstToken.address.toHexString(),
        ]
      );
    }
    if (tokenPrice.equals(constants.BIGDECIMAL_ZERO)) continue;

    if (constants.STABLE_TOKENS[i] == "WETH") {
      tokenPrice = getUsdPricePerToken(dstToken.address).usdPrice;
    }

    return CustomPriceType.initialize(
      tokenPrice.times(
        constants.BIGINT_TEN.pow(srcTokenDecimals.toI32() as u8).toBigDecimal()
      ),
      (dstToken.decimals + constants.DEFAULT_DECIMALS.toI32()) as u8,
      constants.OracleType.INCH_ORACLE
    );
  }

  return new CustomPriceType();
}
