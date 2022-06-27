import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { getFallbackPriceOracle, getPriceOracle } from "../common/initializers";

export function getAssetPriceInUSDC(tokenAddress: Address): BigDecimal {
  // The Aave protocol oracle contracts only contain a method for getting an asset
  // price in ETH, so USDC price must be fetched to convert asset price from Eth to USDC
  // Get the asset price in Wei and convert it to Eth

  const oracle = getPriceOracle();
  let assetPriceInEth = utils.readValue<BigInt>(oracle.try_getAssetPrice(tokenAddress), constants.BIGINT_ZERO);

  // Fetch USDC price in Wei and convert it to Eth
  let priceUSDCInEth = utils.readValue<BigInt>(
    oracle.try_getAssetPrice(Address.fromString(constants.USDC_TOKEN_ADDRESS)),
    constants.BIGINT_ZERO,
  );

  let assetPriceInUSDC = assetPriceInEth.toBigDecimal().div(priceUSDCInEth.toBigDecimal());

  if (assetPriceInUSDC.gt(constants.BIGDECIMAL_ZERO)) {
    return assetPriceInUSDC;
  }

  const fallbackPriceOracle = getFallbackPriceOracle();
  assetPriceInEth = utils.readValue<BigInt>(fallbackPriceOracle.try_getAssetPrice(tokenAddress), constants.BIGINT_ZERO);

  // Fetch USDC price in Wei and convert it to Eth
  priceUSDCInEth = utils.readValue<BigInt>(
    fallbackPriceOracle.try_getAssetPrice(Address.fromString(constants.USDC_TOKEN_ADDRESS)),
    constants.BIGINT_ZERO,
  );

  assetPriceInUSDC = assetPriceInEth.toBigDecimal().div(priceUSDCInEth.toBigDecimal());

  if (assetPriceInUSDC.le(constants.BIGDECIMAL_ZERO)) {
    log.warning("[AssetPrice] Failed for token: {}", [tokenAddress.toHexString()]);
  }

  // Asset price in Eth/USDC priced in Eth = Asset price in in USDC
  // return price per asset in USDC
  return assetPriceInUSDC;
}

export function amountInUSD(priceInUSDC: BigDecimal, decimals: number, amount: BigInt): BigDecimal {
  // This function takes in a token and the amount of the token and converts the amount of that token into USD
  // Also sets the market input/output token prices to the updated amount
  const amountInDecimals = utils.bigIntToBigDecimal(amount, <i32>decimals);
  const amountUSD = amountInDecimals.times(priceInUSDC);

  return amountUSD.truncate(3);
}
