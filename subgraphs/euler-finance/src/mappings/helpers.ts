import { Address, BigDecimal, ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { Borrow, Deposit, Liquidation, Repay, Withdraw } from "../../generated/euler/Euler";
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
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrCreateFinancials,
  getSnapshotRates,
} from "../common/getters";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  InterestRateSide,
  InterestRateType,
  USDC_SYMBOL,
  DECIMAL_PRECISION,
  INTEREST_RATE_PRECISION,
  SECONDS_PER_YEAR,
  RESERVE_FEE_SCALE,
  CRYPTEX_MARKET_ID,
  INTEREST_RATE_DECIMALS,
  BIGDECIMAL_HUNDRED,
  USDC_ERC20_ADDRESS,
  SECONDS_PER_DAY,
  DEFAULT_DECIMALS,
} from "../common/constants";
import { getEthPriceUsd } from "../common/pricing";
import { bigIntChangeDecimals, bigIntToBDUseDecimals } from "../common/conversions";
import { updateFinancials, updateMarketMetrics } from "../common/metrics";
import { getAssetTotalSupply } from "../common/tokens";
import { FinancialsDailySnapshot, Market, MarketDailySnapshot, _AssetStatus } from "../../generated/schema";
import { Exec } from "../../generated/euler/Exec";
import { bigDecimalExponential } from "../common/conversions";

export function createBorrow(event: Borrow): BigDecimal {
  const borrow = getOrCreateBorrow(event);
  const marketId = event.params.underlying.toHexString();
  const tokenId = event.params.underlying.toHexString();
  const accountAddress = event.params.account.toHexString();

  const underlyingToken = getOrCreateToken(event.params.underlying);
  borrow.market = marketId;
  borrow.asset = tokenId;
  borrow.from = marketId;
  borrow.to = accountAddress;
  borrow.amount = bigIntChangeDecimals(event.params.amount, DEFAULT_DECIMALS, underlyingToken.decimals);

  // catch CRYPTEX outlier price at block 15358330
  // see transaction: https://etherscan.io/tx/0x77885d38a6c496fdc39675f57185ab8bb11e8d1f14eb9f4a536fc1c4d24d84d2
  if (
    marketId.toLowerCase() == CRYPTEX_MARKET_ID.toLowerCase() &&
    event.block.number.equals(BigInt.fromI32(15358330))
  ) {
    // this is the price of CTX on August 17, 2022 at 11AM UTC-0
    // see: https://www.coingecko.com/en/coins/cryptex-finance
    const CTX_PRICE = BigDecimal.fromString("3.98");
    borrow.amountUSD = event.params.amount.toBigDecimal().div(DECIMAL_PRECISION).times(CTX_PRICE);
  } else {
    borrow.amountUSD = bigIntToBDUseDecimals(borrow.amount, underlyingToken.decimals).times(
      underlyingToken.lastPriceUSD!,
    );
  }

  borrow.save();

  const market = getOrCreateMarket(marketId);
  market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(borrow.amountUSD);
  market.save();

  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(borrow.amountUSD);
  protocol.save();

  return borrow.amountUSD;
}

export function createDeposit(event: Deposit): BigDecimal {
  const deposit = getOrCreateDeposit(event);
  const marketId = event.params.underlying.toHexString();
  const tokenId = event.params.underlying.toHexString();
  const accountAddress = event.params.account;

  const underlyingToken = getOrCreateToken(event.params.underlying);
  deposit.market = marketId;
  deposit.asset = tokenId;
  deposit.from = accountAddress.toHexString();
  deposit.to = marketId;
  deposit.amount = bigIntChangeDecimals(event.params.amount, DEFAULT_DECIMALS, underlyingToken.decimals);
  deposit.amountUSD = bigIntToBDUseDecimals(deposit.amount, underlyingToken.decimals).times(
    underlyingToken.lastPriceUSD!,
  );

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

  const underlyingToken = getOrCreateToken(event.params.underlying);
  repay.market = marketId;
  repay.asset = tokenId;
  repay.from = accountAddress.toHexString();
  repay.to = marketId;
  repay.amount = bigIntChangeDecimals(event.params.amount, DEFAULT_DECIMALS, underlyingToken.decimals);
  repay.amountUSD = bigIntToBDUseDecimals(repay.amount, underlyingToken.decimals).times(underlyingToken.lastPriceUSD!);

  repay.save();
  market.save();

  return repay.amountUSD;
}

export function createWithdraw(event: Withdraw): BigDecimal {
  const withdraw = getOrCreateWithdraw(event);
  const marketId = event.params.underlying.toHexString();
  const tokenId = event.params.underlying.toHexString();
  const accountAddress = event.params.account;

  const underlyingToken = getOrCreateToken(event.params.underlying);
  withdraw.market = marketId;
  withdraw.asset = tokenId;
  withdraw.from = marketId;
  withdraw.to = accountAddress.toHexString();
  withdraw.amount = bigIntChangeDecimals(event.params.amount, DEFAULT_DECIMALS, underlyingToken.decimals);
  withdraw.amountUSD = bigIntToBDUseDecimals(withdraw.amount, underlyingToken.decimals).times(
    underlyingToken.lastPriceUSD!,
  );

  withdraw.save();

  return withdraw.amountUSD;
}

export function createLiquidation(event: Liquidation): BigDecimal {
  const liquidation = getOrCreateLiquidate(event);
  const underlyingTokenId = event.params.underlying.toHexString();
  const seizedTokenId = event.params.collateral.toHexString();

  const underlyingToken = getOrCreateToken(Address.fromString(underlyingTokenId));
  const seizedToken = getOrCreateToken(Address.fromString(seizedTokenId));

  // repay token market
  const market = getOrCreateMarket(underlyingTokenId);
  const collateralMarket = getOrCreateMarket(seizedTokenId);

  liquidation.market = collateralMarket.id;
  liquidation.asset = underlyingTokenId;
  liquidation.from = event.params.liquidator.toHexString();
  liquidation.to = market.id; // Market that tokens are repaid to
  liquidation.liquidatee = event.params.violator.toHexString();
  // Amount of collateral liquidated in native units (schema definition)
  // Amount is denominated in collateral //TODO: verify
  liquidation.amount = bigIntChangeDecimals(event.params._yield, DEFAULT_DECIMALS, seizedToken.decimals);
  liquidation.amountUSD = bigIntToBDUseDecimals(liquidation.amount, seizedToken.decimals).times(
    seizedToken.lastPriceUSD!,
  );

  const repayUSD = bigIntToBDUseDecimals(event.params.repay, underlyingToken.decimals).times(
    underlyingToken.lastPriceUSD!,
  );
  liquidation.profitUSD = liquidation.amountUSD.minus(repayUSD);
  log.info("[createLiquidation]seizedToken={}/{},amount={},price={},amountUSD={},blk={},tx={}", [
    seizedToken.name,
    seizedTokenId,
    liquidation.amount.toString(),
    seizedToken.lastPriceUSD!.toString(),
    liquidation.amountUSD.toString(),
    event.block.number.toString(),
    event.transaction.hash.toHexString(),
  ]);
  collateralMarket.cumulativeLiquidateUSD = collateralMarket.cumulativeLiquidateUSD.plus(liquidation.amountUSD);
  collateralMarket.save();

  const protocol = getOrCreateLendingProtocol();
  protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidation.amountUSD);
  protocol.save();
  liquidation.save();

  return liquidation.amountUSD;
}

//export function updateLendingFactors(event: GovSetAssetConfig): void {}

// general market / protocol updater
// udpates:
//    rates
//    balances
//    prices
//    revenues
export function syncWithEulerGeneralView(
  eulerViewQueryResponse: EulerGeneralView__doQueryResultRStruct,
  event: ethereum.Event,
): void {
  const block = event.block;
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
  //protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
  //protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  //protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;

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

    log.info(
      "[syncWithEulerGeneralView]blk={},market={},token.id={},currPrice={},currPriceUsd={},token.lastPriceUSD={}",
      [
        event.transaction.hash.toHexString(),
        market.id,
        token.id,
        currPrice.toString(),
        currPriceUsd.toString(),
        token.lastPriceUSD!.toString(),
      ],
    );

    // needed to update the protocol level quantities
    const prevMarketTotalValueLockedUSD = market.totalValueLockedUSD;
    const prevMarketTotalDepositBalanceUSD = market.totalDepositBalanceUSD;
    const prevMarketTotalBorrowBalanceUSD = market.totalBorrowBalanceUSD;

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
    updateMarketMetrics(block, market.id, BIGDECIMAL_ZERO);
    updateMarketHourlyMetrics(block, market.id, BIGDECIMAL_ZERO);
  }
  protocol.save();
  updateFinancials(event.block, BIGDECIMAL_ZERO, "NA");
}

export function updatePrices(execProxyAddress: Address, market: Market, event: ethereum.Event): BigDecimal | null {
  const underlying = Address.fromString(market.inputToken);
  // update price
  const execProxyContract = Exec.bind(execProxyAddress);
  const blockNumber = event.block.number;
  //let underlyingPriceUSD: BigDecimal;
  //if (underlying.toHexString().toLowerCase() == USDC_ERC20_ADDRESS) {
  //  // assume USDC is pegged to $1
  //  underlyingPriceUSD = BIGDECIMAL_ONE;
  //} else {
  // price in WETH
  const underlyingPriceWETHResult = execProxyContract.try_getPriceFull(underlying);
  // this is the inversion of WETH price in USD
  const USDCPriceWETHResult = execProxyContract.try_getPriceFull(Address.fromString(USDC_ERC20_ADDRESS));
  if (underlyingPriceWETHResult.reverted) {
    log.warning("[updatePrices]try_getPriceFull({}) reverted at block {}", [
      underlying.toHexString(),
      blockNumber.toString(),
    ]);
    return null;
  }

  if (USDCPriceWETHResult.reverted) {
    log.warning("[updatePrices]try_getPriceFull({}) reverted at block {}", ["USDC", blockNumber.toString()]);
    return null;
  }

  const underlyingPriceUSD = underlyingPriceWETHResult.value
    .getCurrPrice()
    .divDecimal(USDCPriceWETHResult.value.getCurrPrice().toBigDecimal());
  //}

  const token = getOrCreateToken(underlying);
  token.lastPriceUSD = underlyingPriceUSD;
  token.lastPriceBlockNumber = blockNumber;
  token.save();

  //const market = getOrCreateMarket(underlying.toHexString());
  market.inputTokenPriceUSD = underlyingPriceUSD;
  if (market.exchangeRate && market.exchangeRate!.gt(BIGDECIMAL_ZERO)) {
    market.outputTokenPriceUSD = underlyingPriceUSD.div(market.exchangeRate!);
  }
  market.save();

  const eToken = getOrCreateToken(Address.fromString(market.outputToken!));
  eToken.lastPriceUSD = market.outputTokenPriceUSD;
  eToken.lastPriceBlockNumber = blockNumber;
  eToken.save();

  if (market._dToken && market._dTokenExchangeRate) {
    const dToken = getOrCreateToken(Address.fromString(market._dToken!));
    dToken.lastPriceUSD = underlyingPriceUSD.div(market._dTokenExchangeRate!);
    dToken.lastPriceBlockNumber = blockNumber;
    dToken.save();
  }

  log.info("[updatePrices]tx={},block={},token={}/{},currPriceUSD={}", [
    event.transaction.hash.toHexString(),
    blockNumber.toString(),
    token.name,
    underlying.toHexString(),
    underlyingPriceUSD.toString(),
  ]);

  return underlyingPriceUSD;
}

export function updateInterestRates(
  market: Market,
  interestRate: BigInt,
  reserveFee: BigInt,
  totalBorrows: BigInt,
  totalBalances: BigInt,
  event: ethereum.Event,
): void {
  // interestRate is Borrow Rate in Second Percentage Yield
  // See computeAPYs() in EulerGeneralView.sol
  const borrowSPY = interestRate;
  const borrowAPY = bigDecimalExponential(borrowSPY.divDecimal(INTEREST_RATE_DECIMALS), SECONDS_PER_YEAR).minus(
    BIGDECIMAL_ONE,
  );
  const supplyRevenueShare = BIGDECIMAL_ONE.minus(reserveFee.divDecimal(RESERVE_FEE_SCALE));
  // TODO: verify totalBorrows and totalBalances are correct here
  const supplySPY = interestRate
    .times(totalBorrows)
    .toBigDecimal()
    .times(supplyRevenueShare)
    .div(totalBalances.toBigDecimal());
  const supplyAPY = bigDecimalExponential(supplySPY.div(INTEREST_RATE_DECIMALS), SECONDS_PER_YEAR).minus(
    BIGDECIMAL_ONE,
  );

  const borrowerRate = getOrCreateInterestRate(InterestRateSide.BORROWER, InterestRateType.VARIABLE, market.id);
  borrowerRate.rate = borrowAPY.times(BIGDECIMAL_HUNDRED);
  borrowerRate.save();
  const lenderRate = getOrCreateInterestRate(InterestRateSide.LENDER, InterestRateType.VARIABLE, market.id);
  lenderRate.rate = supplyAPY.times(BIGDECIMAL_HUNDRED);
  lenderRate.save();
  market.rates = [borrowerRate.id, lenderRate.id];
  market.save();

  //TODO: verify rates with EulerGeneralView.doQuery()
  log.info(
    "[updateInterestRates]interest rates for market {} updated to [{}, {}] at block {}; inputs:interestRate={},reserveFee={},totalBorrows={},totalBalances={},tx={}",
    [
      market.id,
      borrowerRate.rate.toString(),
      lenderRate.rate.toString(),
      event.block.number.toString(),
      interestRate.toString(),
      reserveFee.toString(),
      totalBorrows.toString(),
      totalBalances.toString(),
      event.transaction.hash.toHexString(),
    ],
  );

  const marketDailySnapshot = getOrCreateMarketDailySnapshot(event.block, market.id);
  const days = (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString();
  marketDailySnapshot.rates = getSnapshotRates(market.rates, days);
  marketDailySnapshot.blockNumber = event.block.number;
  marketDailySnapshot.timestamp = event.block.timestamp;
  marketDailySnapshot.save();

  const marketHourlySnapshot = getOrCreateMarketDailySnapshot(event.block, market.id);
  const hours = (event.block.timestamp.toI32() / SECONDS_PER_DAY).toString();
  marketHourlySnapshot.rates = getSnapshotRates(market.rates, hours);
  marketHourlySnapshot.blockNumber = event.block.number;
  marketHourlySnapshot.timestamp = event.block.timestamp;
  marketHourlySnapshot.save();
}

export function updateRevenue(
  underlying: Address,
  reserveBalance: BigInt,
  exchangeRate: BigDecimal,
  assetStatus: _AssetStatus,
  event: ethereum.Event,
): void {
  // marketsContract.underlyingToEToken(underlying);
  const marketId = underlying.toHexString();
  const block = event.block;
  const timestamp = event.block.timestamp;
  const token = getOrCreateToken(underlying);

  //TODO
  assert(
    !assetStatus.timestamp || timestamp.ge(assetStatus.timestamp),
    `event timestamp ${timestamp} < assetStatus.timestamp`,
  );

  assert(
    !assetStatus.reserveBalance || reserveBalance.ge(assetStatus.reserveBalance),
    `event reserveBalance ${reserveBalance} < assetStatus.reserveBalance`,
  );

  const deltaProtocolSideRevenue = reserveBalance
    .minus(assetStatus.reserveBalance)
    .toBigDecimal()
    .times(exchangeRate) // convert to underlying
    .div(DECIMAL_PRECISION)
    .times(token.lastPriceUSD!);
  // because protocolSideRev = totalRev * reserveFee/RESERVE_FEE_SCALE
  // ==> totalRev = protocolSideRev * RESERVE_FEE_SCALE / reserveFee
  const deltaTotalRevenue = deltaProtocolSideRevenue
    .times(RESERVE_FEE_SCALE)
    .div(assetStatus.reserveFee.toBigDecimal());
  const deltaSupplySideRevenue = deltaTotalRevenue.minus(deltaProtocolSideRevenue);

  const protocol = getOrCreateLendingProtocol();
  // update protocol revenue
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(deltaTotalRevenue);
  protocol.save();

  const market = getOrCreateMarket(marketId);
  // update market's revenue
  market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  market.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(deltaTotalRevenue);
  market.save();

  log.info("[updateRevenue]market={}/{},blk={},tx={},price={},dProtocolSideRev={},dSupplySideRev={},dTotalRev={}", [
    market.name!,
    market.id,
    event.block.number.toString(),
    event.transaction.hash.toHexString(),
    token.lastPriceUSD!.toString(),
    deltaProtocolSideRevenue.toString(),
    deltaSupplySideRevenue.toString(),
    deltaTotalRevenue.toString(),
  ]);

  const marketDailySnapshot = getOrCreateMarketDailySnapshot(block, marketId);
  const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(block, marketId);
  const financialSnapshot = getOrCreateFinancials(block.timestamp, block.number);

  // update daily snapshot
  marketDailySnapshot.dailySupplySideRevenueUSD =
    marketDailySnapshot.dailySupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  marketDailySnapshot.dailyProtocolSideRevenueUSD =
    marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  marketDailySnapshot.dailyTotalRevenueUSD = marketDailySnapshot.dailyTotalRevenueUSD.plus(deltaTotalRevenue);
  marketDailySnapshot.save();

  // update hourly snapshot
  marketHourlySnapshot.hourlySupplySideRevenueUSD =
    marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  marketHourlySnapshot.hourlyProtocolSideRevenueUSD =
    marketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  marketHourlySnapshot.hourlyTotalRevenueUSD = marketHourlySnapshot.hourlyTotalRevenueUSD.plus(deltaTotalRevenue);
  marketHourlySnapshot.save();

  // update financials
  financialSnapshot.dailySupplySideRevenueUSD =
    financialSnapshot.dailySupplySideRevenueUSD.plus(deltaSupplySideRevenue);
  financialSnapshot.dailyProtocolSideRevenueUSD =
    financialSnapshot.dailyProtocolSideRevenueUSD.plus(deltaProtocolSideRevenue);
  financialSnapshot.dailyTotalRevenueUSD = financialSnapshot.dailyTotalRevenueUSD.plus(deltaTotalRevenue);
  financialSnapshot.save();
}

/**
 *
 * @param blockNumber
 * @param blockTimestamp
 * @returns
 */
export function snapshotFinancials(blockNumber: BigInt, blockTimestamp: BigInt): void {
  const protocol = getOrCreateLendingProtocol();

  const days = (blockTimestamp.toI32() / SECONDS_PER_DAY).toString();
  const snapshot = new FinancialsDailySnapshot(days);

  snapshot.protocol = protocol.id;
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
  snapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
  snapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
  snapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
  snapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  snapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;

  //TODO: replace this loop
  let dailyDepositUSD = BIGDECIMAL_ZERO;
  let dailyBorrowUSD = BIGDECIMAL_ZERO;
  let dailyLiquidateUSD = BIGDECIMAL_ZERO;
  let dailyWithdrawUSD = BIGDECIMAL_ZERO;
  let dailyRepayUSD = BIGDECIMAL_ZERO;
  let dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  let dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  let dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;

  const marketIDs = protocol._marketIDs!;
  for (let i = 0; i < marketIDs.length; i++) {
    const marketID = marketIDs[i];
    const market = Market.load(marketID);
    if (!market) {
      log.warning("[snapshotFinancials] Market not found: {}", [marketID]);
      // best effort
      continue;
    }

    const marketDailySnapshotID = `${marketID}-${days}`;
    const marketDailySnapshot = MarketDailySnapshot.load(marketDailySnapshotID);
    if (!marketDailySnapshot) {
      // this is okay - no MarketDailySnapshot means no transactions in that market during that day
      log.info(
        "[snapshotFinancials] MarketDailySnapshot not found (ie, no transactions in that market) on day {}: {}",
        [days.toString(), marketDailySnapshotID],
      );
      continue;
    }
    dailyDepositUSD = dailyDepositUSD.plus(marketDailySnapshot.dailyDepositUSD);
    dailyBorrowUSD = dailyBorrowUSD.plus(marketDailySnapshot.dailyBorrowUSD);
    dailyLiquidateUSD = dailyLiquidateUSD.plus(marketDailySnapshot.dailyLiquidateUSD);
    dailyWithdrawUSD = dailyWithdrawUSD.plus(marketDailySnapshot.dailyWithdrawUSD);
    dailyRepayUSD = dailyRepayUSD.plus(marketDailySnapshot.dailyRepayUSD);
    dailyTotalRevenueUSD = dailyTotalRevenueUSD.plus(marketDailySnapshot.dailyTotalRevenueUSD);
    dailyProtocolSideRevenueUSD = dailyProtocolSideRevenueUSD.plus(marketDailySnapshot.dailyProtocolSideRevenueUSD);
    dailySupplySideRevenueUSD = dailySupplySideRevenueUSD.plus(marketDailySnapshot.dailySupplySideRevenueUSD);
  }

  snapshot.dailyDepositUSD = dailyDepositUSD;
  snapshot.dailyBorrowUSD = dailyBorrowUSD;
  snapshot.dailyLiquidateUSD = dailyLiquidateUSD;
  snapshot.dailyWithdrawUSD = dailyWithdrawUSD;
  snapshot.dailyRepayUSD = dailyRepayUSD;
  snapshot.dailyTotalRevenueUSD = dailyTotalRevenueUSD;
  snapshot.dailyProtocolSideRevenueUSD = dailyProtocolSideRevenueUSD;
  snapshot.dailySupplySideRevenueUSD = dailySupplySideRevenueUSD;

  snapshot.blockNumber = blockNumber;
  snapshot.timestamp = blockTimestamp;
  snapshot.save();
}

// TODO: delete
export function updateSnapshotRevenues(
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
