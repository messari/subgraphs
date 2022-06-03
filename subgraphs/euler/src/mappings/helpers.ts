import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { EulerGeneralView__doQueryResultRStruct } from "../../generated/euler/EulerGeneralView";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO, DECIMAL_PRECISION, InterestRateSide, InterestRateType, INTEREST_RATE_PRECISION, USDC_SYMBOL } from "../common/constants";
import { getOrCreateInterestRate, getOrCreateLendingProtocol, getOrCreateMarket, getOrCreateMarketUtility, getOrCreateToken } from "../common/getters";
import { updateMarketDailyMetrics, updateMarketHourlyMetrics } from "../common/metrics";
import { getEthPriceUsd } from "../common/pricing";
import { getAssetTotalSupply } from "../common/tokens";

export function updateMarkets(eulerViewQueryResponse: EulerGeneralView__doQueryResultRStruct, block: ethereum.Block): void {
  // let ethUsdcExchangeRate: BigDecimal;
  let ethUsdcExchangeRate = BIGDECIMAL_ONE;
  const eulerViewMarkets = eulerViewQueryResponse.markets;

  // Try to get ETH/USDC exchange rate directly from Euler query...
  const usdcMarketIndex = eulerViewMarkets.findIndex(m => m.symbol === USDC_SYMBOL);
  if (usdcMarketIndex !== -1) {
    ethUsdcExchangeRate = eulerViewMarkets[usdcMarketIndex].currPrice.toBigDecimal();
  } else {
    // ...otherwise fallback to Uniswap,
    // Convert USD/ETH exchange rate to ETH/USD
    ethUsdcExchangeRate = BIGDECIMAL_ONE.div(getEthPriceUsd());
  }

  const protocol = getOrCreateLendingProtocol();
  protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
  protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;

  // Using an indexed for loop because AssemblyScript does not support closures.
  // AS100: Not implemented: Closures
  for (let i = 0; i < eulerViewMarkets.length; i += 1) {
    const eulerViewMarket = eulerViewMarkets[i];
    const market = getOrCreateMarket(eulerViewMarket.underlying.toHexString());
    const marketUtility = getOrCreateMarketUtility(market.id);
    const lendingRate = getOrCreateInterestRate(InterestRateSide.LENDER, InterestRateType.VARIABLE, market.id);
    const borrowRate = getOrCreateInterestRate(InterestRateSide.BORROWER, InterestRateType.VARIABLE, market.id);
    lendingRate.rate = eulerViewMarket.supplyAPY.toBigDecimal().div(INTEREST_RATE_PRECISION);
    borrowRate.rate = eulerViewMarket.borrowAPY.toBigDecimal().div(INTEREST_RATE_PRECISION);
    lendingRate.save();
    borrowRate.save();
    market.rates = market.rates.concat([lendingRate.id, borrowRate.id]);

    const currPrice = eulerViewMarket.currPrice.toBigDecimal().div(DECIMAL_PRECISION);
    const currPriceUsd = currPrice.times(ethUsdcExchangeRate);

    const token = getOrCreateToken(eulerViewMarket.underlying);
    token.lastPriceUSD = currPriceUsd;
    token.lastPriceBlockNumber = block.number;
    token.save();

    const tokenPrecision = new BigDecimal(BigInt.fromI32(10).pow(<u8>token.decimals));
    market.totalDepositBalanceUSD = eulerViewMarket.totalBalances
      .toBigDecimal()
      .div(tokenPrecision)
      .times(currPriceUsd);
    market.totalBorrowBalanceUSD = eulerViewMarket.totalBorrows
      .toBigDecimal()
      .div(tokenPrecision)
      .times(currPriceUsd);
    market.totalValueLockedUSD = market.totalDepositBalanceUSD.minus(market.totalBorrowBalanceUSD);
    market.name = token.name;
    market.inputTokenBalance = eulerViewMarket.totalBalances;
    market.inputTokenPriceUSD = currPriceUsd;

    const previousReserveBalance = marketUtility.reserveBalance;

    /**
     * The following fields are always equal to 0:
     * - eulerMarketView.eTokenBalance
     * - eulerMarketView.eTokenBalanceUnderlying
     * - eulerMarketView.dTokenBalance
     *
     * In order to calculate eToken and dToken price, we need to pull supply off ERC-20 contracts and calculate
     * token price by using totalDepositBalanceUSD and totalBorrowBalanceUSD.
     */
    const eTokenAddress = Address.fromString(marketUtility.eToken);
    const eToken = getOrCreateToken(eTokenAddress);
    const eTokenTotalSupply = getAssetTotalSupply(eTokenAddress);
    const eTokenPrecision = new BigDecimal(BigInt.fromI32(10).pow(<u8>eToken.decimals));
    if (eTokenTotalSupply.gt(BIGINT_ZERO)) {
      const eTokenPriceUSD = market.totalDepositBalanceUSD.div(eTokenTotalSupply.toBigDecimal().div(eTokenPrecision));
      eToken.lastPriceUSD = eTokenPriceUSD;
      eToken.lastPriceBlockNumber = block.number;
      eToken.save();

      market.outputTokenPriceUSD = eTokenPriceUSD;
      market.outputTokenSupply = eTokenTotalSupply;
      market.exchangeRate = eTokenTotalSupply
        .toBigDecimal()
        .div(eTokenPrecision)
        .div(eulerViewMarket.totalBalances.toBigDecimal().div(tokenPrecision));
    }

    const dTokenAddress = Address.fromString(marketUtility.dToken);
    const dToken = getOrCreateToken(dTokenAddress);
    const dTokenTotalSupply = getAssetTotalSupply(dTokenAddress);
    if (dTokenTotalSupply.gt(BIGINT_ZERO)) {
      const dTokenPrecision = new BigDecimal(BigInt.fromI32(10).pow(<u8>dToken.decimals));
      const dTokenPriceUSD = market.totalBorrowBalanceUSD.div(dTokenTotalSupply.toBigDecimal().div(dTokenPrecision));
      dToken.lastPriceUSD = dTokenPriceUSD;
      dToken.lastPriceBlockNumber = block.number;
      dToken.save();
    }

    market.save();

    const reserveBalanceDiff = eulerViewMarket.reserveBalance.minus(previousReserveBalance);
    // Ignore case where there was a balance conversion (negative diff) happening at current block.
    if (reserveBalanceDiff.gt(BIGINT_ZERO) && eToken.lastPriceUSD) {
      const marketRevenueDiffUsd = reserveBalanceDiff
        .toBigDecimal()
        .div(eTokenPrecision)
        .times(eToken.lastPriceUSD!);
      protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(marketRevenueDiffUsd);
      protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(marketRevenueDiffUsd);
    }

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(market.totalValueLockedUSD);
    protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD.plus(market.totalBorrowBalanceUSD);
    protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(market.totalDepositBalanceUSD);

    marketUtility.market = market.id;
    marketUtility.twap = eulerViewMarket.twap;
    marketUtility.twapPeriod = eulerViewMarket.twapPeriod;
    marketUtility.reserveBalance = eulerViewMarket.reserveBalance;
    marketUtility.save();

    updateMarketDailyMetrics(block, market.id);
    updateMarketHourlyMetrics(block, market.id);
  }
  protocol.save();
}
