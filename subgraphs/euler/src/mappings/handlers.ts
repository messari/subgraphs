import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import {
  AssetStatus,
  Borrow,
  Deposit,
  GovSetAssetConfig,
  GovSetReserveFee,
  Liquidation,
  MarketActivated,
  Repay,
  Withdraw
} from "../../generated/euler/Euler"
import {
  EulerGeneralView,
  EulerGeneralView__doQueryResultRStruct,
  EulerGeneralView__doQueryInputQStruct
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
  EULER_ADDRESS,
  EULER_GENERAL_VIEW_ADDRESS,
  EXEC_START_BLOCK_NUMBER,
  ZERO_ADDRESS,
  InterestRateSide,
  InterestRateType,
  CONFIG_FACTOR_SCALE,
  USDC_SYMBOL,
  INITIAL_INTEREST_ACCUMULATOR,
  TransactionType,
  EULER_GENERAL_VIEW_V2_ADDRESS,
  VIEW_V2_START_BLOCK_NUMBER,
  DECIMAL_PRECISION,
  USDC_ERC20_ADDRESS,
} from "../common/constants";
import { getEthPriceUsd, getUnderlyingPrice } from "../common/pricing";
import { amountToUsd } from "../common/conversions";
import { updateFinancials, updateMarketDailyMetrics, updateMarketHourlyMetrics, updateUsageMetrics } from "../common/metrics";
import { _MarketUtility } from "../../generated/schema";

export function handleAssetStatus(event: AssetStatus): void {
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

  // More information about interest accumulator 
  // https://github.com/euler-xyz/euler-contracts/blob/60114fafd99ee6a57d53c069660e0a976874819d/docs/limits.md#interestaccumulator
  marketUtility.interestAccumulator = event.params.interestAccumulator;
  marketUtility.save();

  market.totalDepositBalanceUSD = amountToUsd(
    event.params.totalBalances,
    marketUtility.twap,
    marketUtility.twapPrice,
  );
  market.totalBorrowBalanceUSD = amountToUsd(
    event.params.totalBorrows,
    marketUtility.twap,
    marketUtility.twapPrice,
  );
  
  market.totalValueLockedUSD = market.totalDepositBalanceUSD.minus(market.totalBorrowBalanceUSD); // TODO: Validate this calculation

  token.save();
  market.save();
}

export function handleBorrow(event: Borrow): void {
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
  updateUsageMetrics(event, event.params.account, TransactionType.BORROW);
}

export function handleDeposit(event: Deposit): void {
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
  updateUsageMetrics(event, event.params.account, TransactionType.DEPOSIT);
}


export function handleRepay(event: Repay): void {
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
  updateUsageMetrics(event, event.params.account, TransactionType.REPAY);
}

export function handleWithdraw(event: Withdraw): void {
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
  updateUsageMetrics(event, event.params.account, TransactionType.WITHDRAW);
}

function updateMarketLendingFactors(marketUtility: _MarketUtility, usdcMarketUtility: _MarketUtility) {
  /**
   * Maximum LTV and liquidation thresholds calculations assume the following:
   * - Collateral asset is given market
   * - Borrowed asset is USDC.
   *  
   * In theory, there is a max LTV and liquidation threshold for each possible pair of collateral/borrowed asset, but
   * we are using USDC as borrowed asset for simplification.
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

export function handleGovSetAssetConfig(event: GovSetAssetConfig): void {
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

export function handleGovSetReserveFee(event: GovSetReserveFee): void {
  const marketUtility = getOrCreateMarketUtility(event.params.underlying.toHexString());
  marketUtility.reserveFee = event.params.newReserveFee;
  marketUtility.save();
}

export function handleLiquidation(event: Liquidation): void {
  const liquidation = getOrCreateLiquidate(event);
  const collateralTokenId = event.params.underlying.toHexString();
  const collateralToken = getOrCreateToken(event.params.underlying);
  const seizedTokenId = event.params.collateral.toHexString();
  const seizedToken = getOrCreateToken(event.params.collateral);

  liquidation.market = collateralTokenId;
  liquidation.asset = seizedTokenId;
  liquidation.from = event.params.liquidator.toHexString();
  liquidation.to = event.params.violator.toHexString();
  liquidation.amount = event.params.repay;  // Amount is denominated in underlying (not in dToken)

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

export function handleMarketActivated(event: MarketActivated): void {
  let market = getOrCreateMarket(event.params.underlying.toHexString());
  getOrCreateMarketUtility(event.params.underlying.toHexString());

  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;

  // Market are initliazed in isolated tier, which means currency can't be used as collateral.
  // https://docs.euler.finance/risk-framework/tiers
  market.canUseAsCollateral = false;
  market.canBorrowFrom = true;

  const token = getOrCreateToken(event.params.underlying);
  getOrCreateToken(event.params.dToken);
  const eToken = getOrCreateToken(event.params.eToken);

  market.outputToken = eToken.id;
  market.inputToken = token.id;
  market.save();

  let protocolUtility = getOrCreateProtocolUtility();
  protocolUtility.markets = protocolUtility.markets.concat([market.id]);
  protocolUtility.save();
}

function updateMarkets(eulerViewQueryResponse: EulerGeneralView__doQueryResultRStruct, block: ethereum.Block): void {
  let ethUsdcExchangeRate: BigDecimal;
  const eulerViewMarkets = eulerViewQueryResponse.markets;

  // Try to get ETH/USDC exchange rate directly from Euler query...
  const usdcMarketIndex = eulerViewMarkets.findIndex(m => m.symbol === USDC_SYMBOL);
  if (usdcMarketIndex > 0) {
    ethUsdcExchangeRate = eulerViewMarkets[usdcMarketIndex].currPrice.toBigDecimal();
  } else {
    // ...otherwise fallback to Uniswap,
    // Convert USD/ETH exchange rate to ETH/USD
    ethUsdcExchangeRate = BIGDECIMAL_ONE.div(getEthPriceUsd());
  }

  const protocol = getOrCreateLendingProtocol();
  protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;

  // Using an indexed for loop because AssemblyScript does not support closures.
  // AS100: Not implemented: Closures
  for (let i = 0; i < eulerViewMarkets.length; i += 1) {
    const eulerViewMarket = eulerViewMarkets[i];
    const market = getOrCreateMarket(eulerViewMarket.underlying.toHexString());
    const lendingRate = getOrCreateInterestRate(InterestRateSide.LENDER, InterestRateType.VARIABLE, market.id);
    const borrowRate = getOrCreateInterestRate(InterestRateSide.BORROWER, InterestRateType.VARIABLE, market.id);
    lendingRate.rate = eulerViewMarket.supplyAPY.toBigDecimal().div(DECIMAL_PRECISION);
    borrowRate.rate = eulerViewMarket.borrowAPY.toBigDecimal().div(DECIMAL_PRECISION);
    lendingRate.save();
    borrowRate.save();
    market.rates = market.rates.concat([lendingRate.id, borrowRate.id]);

    const totalBalances = eulerViewMarket.totalBalances;
    const totalBalancesEth = totalBalances.toBigDecimal().times(eulerViewMarket.currPrice.toBigDecimal()).div(DECIMAL_PRECISION);
    market.totalDepositBalanceUSD = totalBalancesEth
      .times(ethUsdcExchangeRate);

    const totalBorrows = eulerViewMarket.totalBorrows;
    const totalBorrowsEth = totalBorrows
      .toBigDecimal()
      .times(eulerViewMarket.currPrice.toBigDecimal())
      .div(DECIMAL_PRECISION);
    market.totalBorrowBalanceUSD = totalBorrowsEth
      .times(ethUsdcExchangeRate);

    market.totalValueLockedUSD = market.totalDepositBalanceUSD.minus(market.totalBorrowBalanceUSD);
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(market.totalValueLockedUSD);

    const currPrice = eulerViewMarket.currPrice.toBigDecimal().div(DECIMAL_PRECISION);
    const currPriceUsd = currPrice
      .times(ethUsdcExchangeRate);
    
    market.inputTokenBalance = eulerViewMarket.totalBalances;
    market.outputTokenSupply = eulerViewMarket.eTokenBalance;
    market.outputTokenPriceUSD = eulerViewMarket.eTokenBalanceUnderlying
      .toBigDecimal()
      .times(currPriceUsd)
      .div(DECIMAL_PRECISION);

    if (eulerViewMarket.eTokenBalanceUnderlying.gt(BIGINT_ZERO)) {
      market.exchangeRate = eulerViewMarket.eTokenBalance
        .toBigDecimal()
        .div(eulerViewMarket.eTokenBalanceUnderlying.toBigDecimal());
    }

    const token = getOrCreateToken(eulerViewMarket.underlying);
    token.lastPriceUSD = currPriceUsd;
    token.lastPriceBlockNumber = block.number;
    token.save();

    market.name = token.name;
    market.save();
    
    if (market.outputToken) {
      const eToken = getOrCreateToken(<Address>Address.fromHexString(market.outputToken!));
      eToken.lastPriceUSD = market.outputTokenPriceUSD;
      eToken.lastPriceBlockNumber = block.number;
      eToken.save();
    }

    const marketUtility = getOrCreateMarketUtility(eulerViewMarket.underlying.toHexString());
    marketUtility.market = market.id;
    marketUtility.twap = eulerViewMarket.twap;
    marketUtility.twapPeriod = eulerViewMarket.twapPeriod;
    marketUtility.reserveBalance = eulerViewMarket.reserveBalance;
    marketUtility.save();

    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
      market.totalBorrowBalanceUSD
        .times(marketUtility.interestAccumulator.minus(INITIAL_INTEREST_ACCUMULATOR).toBigDecimal())
        .div(INITIAL_INTEREST_ACCUMULATOR.toBigDecimal()),
    );

    const reserveBalanceDiff = eulerViewMarket.reserveBalance.minus(marketUtility.reserveBalance);
    // Ignore case where there was a balance conversion happening at current block.
    if (reserveBalanceDiff.gt(BIGINT_ZERO)) {
      const marketRevenueDiffUsd = reserveBalanceDiff
        .toBigDecimal()
        .times(currPriceUsd)
        .div(DECIMAL_PRECISION);
      protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(marketRevenueDiffUsd);
    }
    
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(protocol.cumulativeProtocolSideRevenueUSD).plus(
      protocol.cumulativeSupplySideRevenueUSD
    );

    updateMarketDailyMetrics(block, market.id);
    updateMarketHourlyMetrics(block, market.id);
  }
  protocol.save();
}

export function handleBlockUpdates(block: ethereum.Block): void {
  const viewAddress = block.number.gt(VIEW_V2_START_BLOCK_NUMBER)
    ? EULER_GENERAL_VIEW_V2_ADDRESS
    : EULER_GENERAL_VIEW_ADDRESS;
  const eulerGeneralView = EulerGeneralView.bind(Address.fromString(viewAddress));
  const protocolUtility = getOrCreateProtocolUtility();

  const markets = protocolUtility.markets;
  if (!markets || markets.length == 0) {
    return;
  }

  const marketAddresses: Array<Address> = markets.map<Address>((market: string) => Address.fromString(market));

  const queryParameters: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(Address.fromString(EULER_ADDRESS)),
    ethereum.Value.fromAddress(Address.fromString(ZERO_ADDRESS)),
    ethereum.Value.fromAddressArray(marketAddresses)
  ];

  const queryParametersTuple = changetype<EulerGeneralView__doQueryInputQStruct>(queryParameters);
  const result = eulerGeneralView.try_doQuery(queryParametersTuple);

  if (result.reverted) {
    return;
  }

  updateMarkets(result.value, block);
  updateFinancials(block);
}
