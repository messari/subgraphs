import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import {
  AssetStatus,
  Borrow,
  Deposit,
  GovSetAssetConfig,
  GovSetReserveFee,
  Liquidation,
  Repay,
  Withdraw,
} from "../../generated/euler/Euler";
import {
  EulerGeneralView__doQueryResultRStruct,
} from "../../generated/euler/EulerGeneralView";
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
  INITIAL_INTEREST_ACCUMULATOR,
  DECIMAL_PRECISION,
  USDC_ERC20_ADDRESS,
  INTEREST_RATE_PRECISION,
} from "../common/constants";
import { getEthPriceUsd, getUnderlyingPrice } from "../common/pricing";
import { amountToUsd } from "../common/conversions";
import {
  updateMarketDailyMetrics,
  updateMarketHourlyMetrics,
} from "../common/metrics";
import { Market, _MarketUtility } from "../../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import { getAssetTotalSupply } from "../common/tokens";

function updateCumulativeSupplySideRevenue(cumulatedInterest: BigInt, market: Market): void {
  const cumulatedInterestDelta = cumulatedInterest.toBigDecimal().div(INITIAL_INTEREST_ACCUMULATOR.toBigDecimal());
  const supplySideRevenueDelta = market.totalDepositBalanceUSD.times(cumulatedInterestDelta);
  const lendingProtocol = getOrCreateLendingProtocol();
  lendingProtocol.cumulativeSupplySideRevenueUSD = lendingProtocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueDelta,
  );
  lendingProtocol.cumulativeTotalRevenueUSD = lendingProtocol.cumulativeTotalRevenueUSD.plus(supplySideRevenueDelta);
  lendingProtocol.save();
}

export function updateAsset(event: AssetStatus): void {
  const tokenAddress = event.params.underlying.toHexString();
  let marketUtility = getOrCreateMarketUtility(tokenAddress);
  let token = getOrCreateToken(event.params.underlying);
  let twapPriceWETH = BIGINT_ZERO;

  if (event.block.number.gt(EXEC_START_BLOCK_NUMBER)) {
    twapPriceWETH = getUnderlyingPrice(event.params.underlying);
  }

  const ethPriceUsd = getEthPriceUsd();
  const twapPrice = twapPriceWETH.toBigDecimal().times(ethPriceUsd);
  const market = getOrCreateMarket(tokenAddress);

  token.lastPriceUSD = twapPrice;
  marketUtility.twapPrice = twapPrice;

  // Cumulated interest between last update and now.
  const cumulatedInterest = event.params.interestAccumulator.minus(marketUtility.interestAccumulator);

  updateCumulativeSupplySideRevenue(cumulatedInterest, market);

  // More information about interest accumulator
  // https://github.com/euler-xyz/euler-contracts/blob/60114fafd99ee6a57d53c069660e0a976874819d/docs/limits.md#interestaccumulator
  // https://docs.euler.finance/developers/architecture#external-access-to-interest-accumulators
  marketUtility.interestAccumulator = event.params.interestAccumulator;

  market.totalDepositBalanceUSD = amountToUsd(event.params.totalBalances, marketUtility.twap, marketUtility.twapPrice);
  market.totalBorrowBalanceUSD = amountToUsd(event.params.totalBorrows, marketUtility.twap, marketUtility.twapPrice);
  market.totalValueLockedUSD = market.totalDepositBalanceUSD.minus(market.totalBorrowBalanceUSD);

  marketUtility.save();
  token.save();
  market.save();
}

export function createBorrow(event: Borrow): void {
  const borrow = getOrCreateBorrow(event);
  const token = getOrCreateToken(event.params.underlying);
  const marketId = event.params.underlying.toHexString();
  const tokenId = event.params.underlying.toHexString();
  const accountAddress = event.params.account;

  borrow.market = marketId;
  borrow.asset = tokenId;
  borrow.from = accountAddress.toHexString();
  borrow.to = marketId;
  borrow.amount = event.params.amount;
  const marketUtility = getOrCreateMarketUtility(marketId);
  borrow.amountUSD = amountToUsd(borrow.amount, marketUtility.twap, marketUtility.twapPrice);
  borrow.save();

  if (borrow.amountUSD) {
    const market = getOrCreateMarket(marketId);
    market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrow.amountUSD!);
    market.save();

    const protocol = getOrCreateLendingProtocol();
    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrow.amountUSD!);
    protocol.save();
  }
}

export function createDeposit(event: Deposit): void {
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
}

export function createRepay(event: Repay): void {
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
}

export function createWithdraw(event: Withdraw): void {
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
}

function updateMarketLendingFactors(marketUtility: _MarketUtility, usdcMarketUtility: _MarketUtility): void {
  /**
   * Euler has different collateral and borrow factors for all assets. This means that, in theory, there
   * would be maximumLTV and collateralThreshold for every possible asset pair.
   * 
   * For the sake of simplicity when calculating maximumLTV and liquidationThreshold,
   * let's assume borrowed asset is always USDC and collateral asset is always given asset.
   *
   * maximumLTV = usdcBorrowFactor * assetCollateralFactor
   * liquidationThreshold = maximumLTV
   */
  const market = getOrCreateMarket(marketUtility.id);

  const marketCollateralFactor = marketUtility.collateralFactor.toBigDecimal().div(CONFIG_FACTOR_SCALE);
  const usdcBorrowFactorDecimal = usdcMarketUtility.borrowFactor.toBigDecimal().div(CONFIG_FACTOR_SCALE);

  market.maximumLTV = marketCollateralFactor.times(usdcBorrowFactorDecimal);
  market.liquidationThreshold = market.maximumLTV;
  if (market.maximumLTV != BIGDECIMAL_ZERO) {
    market.canUseAsCollateral = true;
  }
  market.save();
}

export function updateLendingFactors(event: GovSetAssetConfig): void {
  const marketUtility = getOrCreateMarketUtility(event.params.underlying.toHexString());
  marketUtility.borrowFactor = event.params.newConfig.borrowFactor;
  marketUtility.collateralFactor = event.params.newConfig.collateralFactor;
  marketUtility.save();

  if (event.params.underlying.toHexString() === USDC_ERC20_ADDRESS) {
    // When USDC asset config is updated, max LTV and liquidation threshold for all currencies need
    // to be updated as well.
    const usdcMarketUtility = marketUtility;
    const protocolUtility = getOrCreateProtocolUtility();
    for (let i = 0; i < protocolUtility.markets.length; i += 1) {
      const marketId = protocolUtility.markets[i];
      const otherMarketUtility =
        marketId !== USDC_ERC20_ADDRESS ? getOrCreateMarketUtility(marketId) : usdcMarketUtility;
      updateMarketLendingFactors(otherMarketUtility, usdcMarketUtility);
    }
  } else {
    const usdcMarketUtility = getOrCreateMarketUtility(USDC_ERC20_ADDRESS);
    updateMarketLendingFactors(marketUtility, usdcMarketUtility);
  }
}

export function updateReserveFee(event: GovSetReserveFee): void {
  const marketUtility = getOrCreateMarketUtility(event.params.underlying.toHexString());
  marketUtility.reserveFee = event.params.newReserveFee;
  marketUtility.save();
}

export function createLiquidation(event: Liquidation): void {
  const liquidation = getOrCreateLiquidate(event);
  const collateralTokenId = event.params.underlying.toHexString();
  const collateralToken = getOrCreateToken(event.params.underlying);
  const seizedTokenId = event.params.collateral.toHexString();
  const seizedToken = getOrCreateToken(event.params.collateral);

  liquidation.market = collateralTokenId;
  liquidation.asset = seizedTokenId;
  liquidation.from = event.params.liquidator.toHexString();
  liquidation.to = event.params.violator.toHexString();
  liquidation.amount = event.params.repay; // Amount is denominated in underlying (not in dToken)

  if (collateralToken.lastPriceUSD) {
    const collateralMarketUtility = getOrCreateMarketUtility(collateralTokenId);
    liquidation.amountUSD = amountToUsd(
      event.params.repay,
      collateralMarketUtility.twap,
      collateralMarketUtility.twapPrice,
    );
    const collateralMarket = getOrCreateMarket(collateralTokenId);
    collateralMarket.cumulativeLiquidateUSD = collateralMarket.cumulativeLiquidateUSD.plus(liquidation.amountUSD!);

    if (seizedToken.lastPriceUSD) {
      const seizedMarketUtility = getOrCreateMarketUtility(seizedTokenId);
      const yieldUSD = amountToUsd(event.params._yield, seizedMarketUtility.twap, seizedMarketUtility.twapPrice);
      liquidation.profitUSD = yieldUSD.minus(liquidation.amountUSD!);
    }
  }
  liquidation.save();
}

export function updateMarkets(
  eulerViewQueryResponse: EulerGeneralView__doQueryResultRStruct,
  block: ethereum.Block,
): void {
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

    // Ignore case where tokens are pulled out of the reserve.
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
