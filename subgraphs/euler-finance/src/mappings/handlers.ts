import { Address, log } from "@graphprotocol/graph-ts";
import {
  AssetStatus,
  Borrow,
  Deposit,
  Euler,
  GovSetAssetConfig,
  Liquidation,
  MarketActivated,
  Repay,
  Withdraw,
} from "../../generated/euler/Euler";
import {
  getOrCreateAssetStatus,
  getOrCreateLendingProtocol,
  getOrCreateMarket,
  getOrCreateToken,
} from "../common/getters";
import {
  EULER_ADDRESS,
  TransactionType,
  BIGINT_ZERO,
  MODULEID__EXEC,
  CONFIG_FACTOR_SCALE,
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
} from "../common/constants";
import { snapshotFinancials, snapshotMarket, updateUsageMetrics } from "./helpers";
import {
  createBorrow,
  createDeposit,
  createLiquidation,
  createRepay,
  createWithdraw,
  updateInterestRates,
  updatePrices,
  updateRevenue,
} from "./helpers";
import { Token } from "../../generated/schema";
import { ERC20 } from "../../generated/euler/ERC20";
import { GovConvertReserves, GovSetReserveFee } from "../../generated/euler/Exec";
import { bigIntChangeDecimals, bigIntToBDUseDecimals } from "../common/conversions";

export function handleAssetStatus(event: AssetStatus): void {
  const underlying = event.params.underlying;
  const marketId = underlying.toHexString();
  //const block = event.block;
  const totalBorrows = event.params.totalBorrows; //== dToken totalSupply
  const totalBalances = event.params.totalBalances; //== eToken totalSupply
  const reserveBalance = event.params.reserveBalance;
  const poolSize = event.params.poolSize;
  const interestRate = event.params.interestRate;

  const protocol = getOrCreateLendingProtocol();
  const market = getOrCreateMarket(marketId);
  const assetStatus = getOrCreateAssetStatus(marketId);
  const token = Token.load(marketId)!;

  const totalBorrowBalance = bigIntChangeDecimals(totalBorrows, DEFAULT_DECIMALS, token.decimals);
  const totalDepositBalance = bigIntChangeDecimals(poolSize.plus(totalBorrowBalance), DEFAULT_DECIMALS, token.decimals);
  if (totalBalances.gt(BIGINT_ZERO)) {
    market.exchangeRate = bigIntToBDUseDecimals(totalDepositBalance, token.decimals).div(
      bigIntToBDUseDecimals(totalBalances, DEFAULT_DECIMALS),
    );
  }

  market.inputTokenBalance = totalDepositBalance;
  market.outputTokenSupply = totalBalances;

  const dTokenAddress = Address.fromString(market._dToken!);
  const dToken = ERC20.bind(dTokenAddress);
  // these should always equal
  // totalBorrows == dTokenTotalSupply
  if (totalBorrows.gt(BIGINT_ZERO)) {
    const dTokenTotalSupply = dToken.totalSupply();
    if (dTokenTotalSupply.gt(BIGINT_ZERO)) {
      market._dTokenSupply = dTokenTotalSupply;
      market._dTokenExchangeRate = bigIntToBDUseDecimals(totalBorrowBalance, token.decimals).div(
        bigIntToBDUseDecimals(dTokenTotalSupply, DEFAULT_DECIMALS),
      );
    }
  }
  market.save();
  if (interestRate.notEqual(assetStatus.interestRate)) {
    // update interest rates if `interestRate` or `reserveFee` changed
    updateInterestRates(market, interestRate, assetStatus.reserveFee, totalBorrows, totalBalances, event);
  }
  updateRevenue(reserveBalance, protocol, market, assetStatus, event);
  snapshotMarket(event.block, marketId, BIGDECIMAL_ZERO, null);

  //verification only
  const eTokenAddress = Address.fromString(market.outputToken!);
  const eToken = ERC20.bind(eTokenAddress);
  const eTokenTotalSupply = eToken.totalSupply();
  if (totalBalances.notEqual(eTokenTotalSupply)) {
    log.warning("[logAssetStatus]market={}/{},totalBalances={},eTokenTotalSupply={}", [
      market.name!,
      market.id,
      totalBalances.toString(),
      eTokenTotalSupply.toString(),
    ]);
  }

  // update tvl, totalDeposit, totalBorrow
  const eulerContract = Euler.bind(Address.fromString(EULER_ADDRESS));
  const execProxyAddress = eulerContract.moduleIdToProxy(MODULEID__EXEC);
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol._marketIDs!.length; i++) {
    const mrktID = protocol._marketIDs![i];
    const mrkt = getOrCreateMarket(mrktID);
    const tkn = getOrCreateToken(Address.fromString(mrkt.inputToken));
    let underlyingPriceUSD = updatePrices(execProxyAddress, mrkt, event);
    if (!underlyingPriceUSD) underlyingPriceUSD = mrkt.inputTokenPriceUSD;
    // mark-to-market
    mrkt.totalDepositBalanceUSD = bigIntToBDUseDecimals(mrkt.inputTokenBalance, tkn.decimals).times(underlyingPriceUSD);
    mrkt.totalBorrowBalanceUSD = bigIntToBDUseDecimals(mrkt._dTokenSupply!, DEFAULT_DECIMALS)
      .times(mrkt._dTokenExchangeRate!)
      .times(underlyingPriceUSD);
    mrkt.totalValueLockedUSD = mrkt.totalDepositBalanceUSD;
    mrkt.save();

    log.debug(
      "[handleAssetStatus]market={}/{},block={},totalBorrowBalanceUSD={},totalDepositBalanceUSD={},exchangeRate={},PriceUSD={}",
      [
        market.name!,
        market.id,
        event.block.number.toString(),
        mrkt.totalBorrowBalanceUSD.toString(),
        mrkt.totalDepositBalanceUSD.toString(),
        market.exchangeRate!.toString(),
        underlyingPriceUSD.toString(),
      ],
    );

    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(mrkt.totalDepositBalanceUSD);
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(mrkt.totalBorrowBalanceUSD);
  }

  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  protocol.totalValueLockedUSD = totalDepositBalanceUSD;
  protocol.save();

  log.debug("[handleAssetStatus]block={},protocol.totalBorrowBalanceUSD={},protocol.totalDepositBalanceUSD={}", [
    event.block.number.toString(),
    protocol.totalBorrowBalanceUSD.toString(),
    protocol.totalDepositBalanceUSD.toString(),
  ]);

  snapshotFinancials(event.block, BIGDECIMAL_ZERO, null, protocol);

  assetStatus.totalBorrows = totalBorrows;
  assetStatus.totalBalances = totalBalances;
  assetStatus.reserveBalance = reserveBalance;
  assetStatus.interestRate = interestRate;
  assetStatus.timestamp = event.params.timestamp;
  assetStatus.save();
}

export function handleBorrow(event: Borrow): void {
  const borrowUSD = createBorrow(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.account, TransactionType.BORROW);
  snapshotMarket(event.block, marketId, borrowUSD, TransactionType.BORROW);
  snapshotFinancials(event.block, borrowUSD, TransactionType.BORROW);
}

export function handleDeposit(event: Deposit): void {
  const depositUSD = createDeposit(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.account, TransactionType.DEPOSIT);
  snapshotMarket(event.block, marketId, depositUSD, TransactionType.DEPOSIT);
  snapshotFinancials(event.block, depositUSD, TransactionType.DEPOSIT);
}

export function handleRepay(event: Repay): void {
  const repayUSD = createRepay(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.account, TransactionType.REPAY);
  snapshotMarket(event.block, marketId, repayUSD, TransactionType.REPAY);
  snapshotFinancials(event.block, repayUSD, TransactionType.REPAY);
}

export function handleWithdraw(event: Withdraw): void {
  const withdrawUSD = createWithdraw(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.account, TransactionType.WITHDRAW);
  snapshotMarket(event.block, marketId, withdrawUSD, TransactionType.WITHDRAW);
  snapshotFinancials(event.block, withdrawUSD, TransactionType.WITHDRAW);
}

export function handleLiquidation(event: Liquidation): void {
  const liquidateUSD = createLiquidation(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.liquidator, TransactionType.LIQUIDATE);
  snapshotMarket(event.block, marketId, liquidateUSD, TransactionType.LIQUIDATE);
  snapshotFinancials(event.block, liquidateUSD, TransactionType.LIQUIDATE);
}

export function handleGovSetAssetConfig(event: GovSetAssetConfig): void {
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
  const market = getOrCreateMarket(event.params.underlying.toHexString());
  market.maximumLTV = event.params.newConfig.collateralFactor.toBigDecimal().div(CONFIG_FACTOR_SCALE);
  market.liquidationThreshold = event.params.newConfig.borrowFactor.toBigDecimal().div(CONFIG_FACTOR_SCALE);
  if (market.maximumLTV.gt(BIGDECIMAL_ZERO)) {
    market.canUseAsCollateral = true;
  }
  market.save();
}

export function handleMarketActivated(event: MarketActivated): void {
  const market = getOrCreateMarket(event.params.underlying.toHexString());

  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;

  // Market are initialized in isolated tier, which means currency can't be used as collateral.
  // https://docs.euler.finance/risk-framework/tiers
  // for borrowIsolated tier assetConfig({borrowIsolated: true})
  // for cross tier assetConfig({borrowIsolated: false, collateralFactor: 0})
  // for collateral tier assetConfig({borrowIsolated: false, collateralFactor: > 0})
  market.canUseAsCollateral = false; //initial collateralFactor=0, reset in handleGovSetAssetConfig
  market.canBorrowFrom = true;

  const underlyingToken = getOrCreateToken(event.params.underlying);
  const eToken = getOrCreateToken(event.params.eToken);
  const dToken = getOrCreateToken(event.params.dToken);

  market.name = underlyingToken.symbol; //TODO -> eToken.name
  market.inputToken = underlyingToken.id;
  market.outputToken = eToken.id;
  market._dToken = dToken.id;
  market.save();

  //TODO: pToken?
}

export function handleGovConvertReserves(event: GovConvertReserves): void {
  const assetStatus = getOrCreateAssetStatus(event.params.underlying.toHexString());
  assetStatus.reserveBalance = assetStatus.reserveBalance.minus(event.params.amount);
  assetStatus.save();
}

export function handleGovSetReserveFee(event: GovSetReserveFee): void {
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  assetStatus.reserveFee = event.params.newReserveFee;
  assetStatus.save();
  //need to update supplier interest rate when reserve fee changes
  const market = getOrCreateMarket(underlying);
  updateInterestRates(
    market,
    assetStatus.interestRate,
    assetStatus.reserveFee,
    assetStatus.totalBorrows,
    assetStatus.totalBalances,
    event,
  );
}
