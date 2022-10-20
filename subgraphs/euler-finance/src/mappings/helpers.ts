import { Address, BigDecimal, ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import {
  AssetStatus,
  Borrow,
  Deposit,
  GovSetAssetConfig,
  Liquidation,
  MarketActivated,
  Repay,
  Withdraw,
} from "../../generated/euler/Euler";
import { EulerGeneralView__doQueryResultRStruct } from "../../generated/euler/EulerGeneralView";
import {
  getOrCreateDeposit,
  getOrCreateToken,
  getOrCreateMarket,
  getOrCreateInterestRate,
  getOrCreateWithdraw,
  getOrCreateBorrow,
  getOrCreateLendingProtocol,
  getOrCreateLiquidate,
  getOrCreateMarketUtility,
  getOrCreateRepay,
  getOrCreateProtocolUtility,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateFinancials,
} from "../common/getters";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  EXEC_START_BLOCK_NUMBER,
  InterestRateSide,
  InterestRateType,
  CONFIG_FACTOR_SCALE,
  USDC_SYMBOL,
  DECIMAL_PRECISION,
  INTEREST_RATE_PRECISION,
  SECONDS_PER_YEAR,
  RESERVE_FEE_SCALE,
  CRYPTEX_MARKET_ID,
} from "../common/constants";
import { getEthPriceUsd, getUnderlyingPrice } from "../common/pricing";
import { amountToUsd } from "../common/conversions";
import { getAssetTotalSupply } from "../common/tokens";

export function updateAsset(event: AssetStatus): void {
  const tokenAddress = event.params.underlying.toHexString();
  const marketUtility = getOrCreateMarketUtility(tokenAddress);
  const token = getOrCreateToken(event.params.underlying);
  let twapPriceWETH = BIGINT_ZERO;

  if (event.block.number.gt(EXEC_START_BLOCK_NUMBER)) {
    twapPriceWETH = getUnderlyingPrice(event.params.underlying);
  }

  const ethPriceUsd = getEthPriceUsd();
  const twapPrice = twapPriceWETH.toBigDecimal().times(ethPriceUsd);
  const market = getOrCreateMarket(tokenAddress);

  token.lastPriceUSD = twapPrice;
  token.lastPriceBlockNumber = event.block.number;
  marketUtility.twapPrice = twapPrice;

  market.totalDepositBalanceUSD = amountToUsd(event.params.totalBalances, marketUtility.twap, marketUtility.twapPrice);
  market.totalBorrowBalanceUSD = amountToUsd(event.params.totalBorrows, marketUtility.twap, marketUtility.twapPrice);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  marketUtility.save();
  token.save();
  market.save();
}

export function createBorrow(event: Borrow): BigDecimal {
  const borrow = getOrCreateBorrow(event);
  const marketId = event.params.underlying.toHexString();
  const tokenId = event.params.underlying.toHexString();
  const accountAddress = event.params.account;

  borrow.market = marketId;
  borrow.asset = tokenId;
  borrow.from = accountAddress.toHexString();
  borrow.to = marketId;
  borrow.amount = event.params.amount;
  const marketUtility = getOrCreateMarketUtility(marketId);

  // catch CRYPTEX outlier price at block 15358330
  // see transaction: https://etherscan.io/tx/0x77885d38a6c496fdc39675f57185ab8bb11e8d1f14eb9f4a536fc1c4d24d84d2
  if (
    marketId.toLowerCase() == CRYPTEX_MARKET_ID.toLowerCase() &&
    event.block.number.equals(BigInt.fromI32(15358330))
  ) {
    // this is the price of CTX on August 17, 2022 at 11AM UTC-0
    // see: https://www.coingecko.com/en/coins/cryptex-finance
    const CTX_PRICE = BigDecimal.fromString("3.98");
    borrow.amountUSD = borrow.amount.toBigDecimal().div(DECIMAL_PRECISION).times(CTX_PRICE);
  } else {
    borrow.amountUSD = amountToUsd(borrow.amount, marketUtility.twap, marketUtility.twapPrice);
  }

  borrow.save();

  if (borrow.amountUSD) {
    const market = getOrCreateMarket(marketId);
    market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrow.amountUSD);
    market.save();

    const protocol = getOrCreateLendingProtocol();
    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrow.amountUSD);
    protocol.save();
  }

  return borrow.amountUSD;
}

export function createDeposit(event: Deposit): BigDecimal {
  const deposit = getOrCreateDeposit(event);
  const marketId = event.params.underlying.toHexString();
  const tokenId = event.params.underlying.toHexString();
  const accountAddress = event.params.account;
  deposit.market = marketId;
  deposit.asset = tokenId;
  deposit.from = accountAddress.toHexString();
  deposit.to = marketId;
  deposit.amount = event.params.amount;
  const marketUtility = getOrCreateMarketUtility(marketId);
  deposit.amountUSD = amountToUsd(deposit.amount, marketUtility.twap, marketUtility.twapPrice);
  deposit.save();

  const market = getOrCreateMarket(marketId);
  market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(deposit.amountUSD);
  market.save();

  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(deposit.amountUSD);
  protocol.save();

  return deposit.amountUSD;
}

export function createRepay(event: Repay): BigDecimal {
  const repay = getOrCreateRepay(event);
  const marketId = event.params.underlying.toHexString();
  const market = getOrCreateMarket(marketId);
  const tokenId = event.params.underlying.toHexString();
  const accountAddress = event.params.account;

  repay.market = marketId;
  repay.asset = tokenId;
  repay.from = accountAddress.toHexString();
  repay.to = marketId;
  repay.amount = event.params.amount;
  const marketUtility = getOrCreateMarketUtility(marketId);
  repay.amountUSD = amountToUsd(repay.amount, marketUtility.twap, marketUtility.twapPrice);

  repay.save();
  market.save();

  return repay.amountUSD;
}

export function createWithdraw(event: Withdraw): BigDecimal {
  const withdraw = getOrCreateWithdraw(event);
  const marketId = event.params.underlying.toHexString();
  const market = getOrCreateMarket(marketId);
  const tokenId = event.params.underlying.toHexString();
  const accountAddress = event.params.account;

  withdraw.market = marketId;
  withdraw.asset = tokenId;
  withdraw.from = accountAddress.toHexString();
  withdraw.to = marketId;
  withdraw.amount = event.params.amount;
  const marketUtility = getOrCreateMarketUtility(marketId);
  withdraw.amountUSD = amountToUsd(withdraw.amount, marketUtility.twap, marketUtility.twapPrice);

  withdraw.save();
  market.save();

  return withdraw.amountUSD;
}

export function createLiquidation(event: Liquidation): BigDecimal {
  const liquidation = getOrCreateLiquidate(event);
  const collateralTokenId = event.params.underlying.toHexString();
  const seizedTokenId = event.params.collateral.toHexString();

  // repay token market
  const market = getOrCreateMarket(collateralTokenId);

  liquidation.market = collateralTokenId;
  liquidation.asset = seizedTokenId;
  liquidation.from = event.params.liquidator.toHexString();
  liquidation.to = market.outputToken!; // eToken transfered to liquidator
  liquidation.liquidatee = event.params.violator.toHexString();
  liquidation.amount = event.params.repay; // Amount is denominated in underlying (not in dToken)

  const collateralMarketUtility = getOrCreateMarketUtility(collateralTokenId);
  liquidation.amountUSD = amountToUsd(
    event.params.repay,
    collateralMarketUtility.twap,
    collateralMarketUtility.twapPrice,
  );
  const collateralMarket = getOrCreateMarket(collateralTokenId);
  collateralMarket.cumulativeLiquidateUSD = collateralMarket.cumulativeLiquidateUSD.plus(liquidation.amountUSD);

  const seizedMarketUtility = getOrCreateMarketUtility(seizedTokenId);
  const yieldUSD = amountToUsd(event.params._yield, seizedMarketUtility.twap, seizedMarketUtility.twapPrice);
  liquidation.profitUSD = yieldUSD.minus(liquidation.amountUSD);

  if (liquidation.amountUSD) {
    market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(liquidation.amountUSD);
    market.save();

    const protocol = getOrCreateLendingProtocol();
    protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidation.amountUSD);
    protocol.save();
  }
  liquidation.save();

  return liquidation.amountUSD;
}

export function updateLendingFactors(event: GovSetAssetConfig): void {
  const marketUtility = getOrCreateMarketUtility(event.params.underlying.toHexString());
  marketUtility.borrowFactor = event.params.newConfig.borrowFactor;
  marketUtility.collateralFactor = event.params.newConfig.collateralFactor;
  marketUtility.save();

  /**
   * Euler has different collateral and borrow factors for all assets. This means that, in theory, there
   * would be maximumLTV and collateralThreshold for every possible asset pair.
   *
   * For the sake of simplicity:
   *  The maximumLTV is the collateral factor. This is the risk-adjusted liquidity of assets in a market
   *  The liquidationThreshold is the borrow factor. If the borrow goes over the borrow factor
   *                times the collateral factor of the collateral's market the borrow is at
   *                risk of liquidation.
   *
   * maximumLTV = collateralFactor
   * liquidationThreshold = borrowFactor
   */
  const market = getOrCreateMarket(marketUtility.id);
  market.maximumLTV = marketUtility.collateralFactor.toBigDecimal().div(CONFIG_FACTOR_SCALE);
  market.liquidationThreshold = marketUtility.borrowFactor.toBigDecimal().div(CONFIG_FACTOR_SCALE);
  market.save();
}

export function createMarket(event: MarketActivated): void {
  const market = getOrCreateMarket(event.params.underlying.toHexString());
  const marketUtility = getOrCreateMarketUtility(event.params.underlying.toHexString());

  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;

  // Market are initialized in isolated tier, which means currency can't be used as collateral.
  // https://docs.euler.finance/risk-framework/tiers
  market.canUseAsCollateral = false;
  market.canBorrowFrom = true;

  const token = getOrCreateToken(event.params.underlying);
  const dToken = getOrCreateToken(event.params.dToken);
  const eToken = getOrCreateToken(event.params.eToken);

  market.name = token.symbol;
  market.outputToken = eToken.id;
  market.inputToken = token.id;
  market.save();

  marketUtility.token = token.id;
  marketUtility.eToken = eToken.id;
  marketUtility.dToken = dToken.id;
  marketUtility.save();

  const protocolUtility = getOrCreateProtocolUtility(event.block.number.toI32());
  protocolUtility.markets = protocolUtility.markets.concat([market.id]);
  protocolUtility.save();
}

// general market / protocol updater
// udpates:
//    rates
//    balances
//    prices
//    revenues
export function syncWithEulerGeneralView(
  eulerViewQueryResponse: EulerGeneralView__doQueryResultRStruct,
  block: ethereum.Block,
): void {
  let ethUsdcExchangeRate = BIGDECIMAL_ONE;
  const eulerViewMarkets = eulerViewQueryResponse.markets;

  // Try to get ETH/USDC exchange rate directly from Euler query...
  const usdcMarketIndex = eulerViewMarkets.findIndex((m) => m.symbol === USDC_SYMBOL);
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
  const marketsCount = eulerViewMarkets.length;
  for (let i = 0; i < marketsCount; i += 1) {
    const eulerViewMarket = eulerViewMarkets[i];
    const market = getOrCreateMarket(eulerViewMarket.underlying.toHexString());
    log.info("[syncWithEulerGeneralView]{}/{},market={}", [i.toString(), marketsCount.toString(), market.id]);
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
    market.totalBorrowBalanceUSD = eulerViewMarket.totalBorrows.toBigDecimal().div(tokenPrecision).times(currPriceUsd);
    market.totalValueLockedUSD = market.totalDepositBalanceUSD;
    market.name = token.name;
    market.inputTokenBalance = eulerViewMarket.totalBalances;
    market.inputTokenPriceUSD = currPriceUsd;

    /**
     * The following fields are always equal to 0:
     * - eulerMarketView.eTokenBalance
     * - eulerMarketView.eTokenBalanceUnderlying
     * - eulerMarketView.dTokenBalance
     *
     * In order to calculate eToken and dToken price, we need to pull supply off ERC-20 contracts and calculate
     * token price by using totalDepositBalanceUSD and totalBorrowBalanceUSD.
     */
    if (marketUtility.eToken) {
      const eTokenAddress = Address.fromString(marketUtility.eToken!);
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
        market.exchangeRate = eulerViewMarket.totalBalances
          .toBigDecimal()
          .div(tokenPrecision)
          .div(eTokenTotalSupply.toBigDecimal().div(eTokenPrecision));
      }
    }

    if (marketUtility.dToken) {
      const dTokenAddress = Address.fromString(marketUtility.dToken!);
      const dToken = getOrCreateToken(dTokenAddress);
      const dTokenTotalSupply = getAssetTotalSupply(dTokenAddress);
      if (dTokenTotalSupply.gt(BIGINT_ZERO)) {
        const dTokenPrecision = new BigDecimal(BigInt.fromI32(10).pow(<u8>dToken.decimals));
        const dTokenPriceUSD = market.totalBorrowBalanceUSD.div(dTokenTotalSupply.toBigDecimal().div(dTokenPrecision));
        dToken.lastPriceUSD = dTokenPriceUSD;
        dToken.lastPriceBlockNumber = block.number;
        dToken.save();
      }
    }

    // find new revenue
    const secondsSinceLastUpdate = block.timestamp.minus(marketUtility.lastUpdateTimestamp);

    const supplyAPY = lendingRate.rate.div(BigDecimal.fromString("100"));
    const supplyYield = supplyAPY.times(secondsSinceLastUpdate.toBigDecimal()).div(SECONDS_PER_YEAR);
    const supplySideRevenueSinceLastUpdate = supplyYield.times(market.totalDepositBalanceUSD);

    const reserveAPY = supplyAPY
      .div(BIGDECIMAL_ONE.minus(eulerViewMarket.reserveFee.toBigDecimal().div(RESERVE_FEE_SCALE)))
      .minus(supplyAPY);
    const reserveYield = reserveAPY.times(secondsSinceLastUpdate.toBigDecimal()).div(SECONDS_PER_YEAR);
    const protocolSideRevenueSinceLastUpdate = reserveYield.times(market.totalDepositBalanceUSD);

    const totalRevenueSinceLastUpdate = supplySideRevenueSinceLastUpdate.plus(protocolSideRevenueSinceLastUpdate);

    // update protocol revenue
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
      supplySideRevenueSinceLastUpdate,
    );
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
      protocolSideRevenueSinceLastUpdate,
    );
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(totalRevenueSinceLastUpdate);

    // update market's revenue
    market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(
      supplySideRevenueSinceLastUpdate,
    );
    market.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD.plus(
      protocolSideRevenueSinceLastUpdate,
    );
    market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(totalRevenueSinceLastUpdate);
    market.save();

    updateSnapshotRevenues(
      market.id,
      block,
      supplySideRevenueSinceLastUpdate,
      protocolSideRevenueSinceLastUpdate,
      totalRevenueSinceLastUpdate,
    );

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(market.totalValueLockedUSD);
    protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD.plus(market.totalBorrowBalanceUSD);
    protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(market.totalDepositBalanceUSD);

    marketUtility.lastUpdateTimestamp = block.timestamp;
    marketUtility.market = market.id;
    marketUtility.twap = eulerViewMarket.twap;
    marketUtility.twapPeriod = eulerViewMarket.twapPeriod;
    marketUtility.save();

    //market daily/hourly snapshots are updated in the handler function after updateProtocolAndMarkets() call
  }
  protocol.save();
}

function updateSnapshotRevenues(
  marketId: string,
  block: ethereum.Block,
  supplySideRevenueDelta: BigDecimal,
  protocolSideRevenueDelta: BigDecimal,
  totalRevenueDelta: BigDecimal,
): void {
  const marketDailySnapshot = getOrCreateMarketDailySnapshot(block, marketId);
  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(block, marketId);
  const financialSnapshot = getOrCreateFinancials(block.timestamp, block.number);

  // update daily snapshot
  marketDailySnapshot.dailySupplySideRevenueUSD =
    marketDailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueDelta);
  marketDailySnapshot.dailyProtocolSideRevenueUSD =
    marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueDelta);
  marketDailySnapshot.dailyTotalRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.plus(totalRevenueDelta);
  marketDailySnapshot.save();

  // update hourly snapshot
  marketHourlySnapshot.hourlySupplySideRevenueUSD =
    marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueDelta);
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(protocolSideRevenueDelta);
  marketHourlySnapshot.hourlyTotalRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.plus(totalRevenueDelta);
  marketHourlySnapshot.save();

  // update financials
  financialSnapshot.dailySupplySideRevenueUSD =
    financialSnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueDelta);
  financialSnapshot.dailyProtocolSideRevenueUSD =
    financialSnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueDelta);
  financialSnapshot.dailyTotalRevenueUSD = financialSnapshot.dailyTotalRevenueUSD.plus(totalRevenueDelta);
  financialSnapshot.save();
}
