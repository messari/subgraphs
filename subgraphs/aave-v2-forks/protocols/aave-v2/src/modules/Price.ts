import * as utils from "../common/utils";
import { BIGINT_ZERO, equalsIgnoreCase, Network, USDC_TOKEN_ADDRESS } from "../common/constants";
import { Address, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { getOrCreateToken, getPriceOracle } from "../common/initializers";
import { IPriceOracleGetter } from "../../../../generated/templates/LendingPool/IPriceOracleGetter";

export function getAssetPriceInUSDC(tokenAddress: Address): BigDecimal {
  let oracle = getPriceOracle();
  let oracleResult = utils.readValue<BigInt>(oracle.try_getAssetPrice(tokenAddress), BIGINT_ZERO);

  // if the result is zero or less, try the fallback oracle
  if (!oracleResult.gt(BIGINT_ZERO)) {
    let tryFallback = oracle.try_getFallbackOracle();
    if (tryFallback) {
      let fallbackOracle = IPriceOracleGetter.bind(tryFallback.value);
      oracleResult = utils.readValue<BigInt>(fallbackOracle.try_getAssetPrice(tokenAddress), BIGINT_ZERO);
    }
  }

  // Mainnet Oracles return the price in eth, must convert to USD through the following method
  if (equalsIgnoreCase(dataSource.network(), Network.MAINNET)) {
    let priceUSDCInEth = utils.readValue<BigInt>(
      oracle.try_getAssetPrice(Address.fromString(USDC_TOKEN_ADDRESS)),
      BIGINT_ZERO,
    );

    return oracleResult.toBigDecimal().div(priceUSDCInEth.toBigDecimal());
  }

  // otherwise return the output of the price oracle
  let inputToken = getOrCreateToken(tokenAddress);
  return oracleResult.toBigDecimal().div(utils.exponentToBigDecimal(inputToken.decimals));
}

export function amountInUSD(priceInUSDC: BigDecimal, decimals: number, amount: BigInt): BigDecimal {
  // This function takes in a token and the amount of the token and converts the amount of that token into USD
  // Also sets the market input/output token prices to the updated amount
  const amountInDecimals = utils.bigIntToBigDecimal(amount, <i32>decimals);
  const amountUSD = amountInDecimals.times(priceInUSDC);

  return amountUSD.truncate(3);
}
