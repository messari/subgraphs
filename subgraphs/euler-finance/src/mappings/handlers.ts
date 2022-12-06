import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
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
  getCurrentEpoch,
  getCutoffValue,
  getDeltaStakeAmount,
  getOrCreateAssetStatus,
  getOrCreateLendingProtocol,
  getOrCreateMarket,
  getOrCreateRewardToken,
  getOrCreateToken,
  getStartBlockForEpoch,
} from "../common/getters";
import {
  EULER_ADDRESS,
  TransactionType,
  BIGINT_ZERO,
  MODULEID__EXEC,
  CONFIG_FACTOR_SCALE,
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  BIGINT_SEVENTY_FIVE,
  START_EPOCH,
  EUL_DIST,
  EUL_DECIMALS,
  RewardTokenType,
  EUL_ADDRESS,
  BLOCKS_PER_DAY,
  BLOCKS_PER_EPOCH,
  BIGINT_ONE,
} from "../common/constants";
import { snapshotFinancials, snapshotMarket, updateUsageMetrics, updateWeightedStakeAmount } from "./helpers";
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
import { LendingProtocol, Market, Token } from "../../generated/schema";
import { ERC20 } from "../../generated/euler/ERC20";
import { GovConvertReserves, GovSetReserveFee } from "../../generated/euler/Exec";
import { BigDecimalTruncateToBigInt, bigIntChangeDecimals, bigIntToBDUseDecimals } from "../common/conversions";
import { _Epoch } from "../../generated/schema";
import { Stake } from "../../generated/EulStakes/EulStakes";

export function handleAssetStatus(event: AssetStatus): void {
  const underlying = event.params.underlying.toHexString();
  const totalBorrows = event.params.totalBorrows; //== dToken totalSupply
  const totalBalances = event.params.totalBalances; //== eToken totalSupply
  const reserveBalance = event.params.reserveBalance;
  const poolSize = event.params.poolSize;
  const interestRate = event.params.interestRate;

  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  const protocol = getOrCreateLendingProtocol();
  const market = getOrCreateMarket(marketId);
  const token = Token.load(underlying)!;

  // totalBorrows is divided by INTERNAL_DEBT_PRECISION in logAssetStatus() (L346 BasicLogic.sol)
  const totalBorrowBalance = bigIntChangeDecimals(totalBorrows, DEFAULT_DECIMALS, token.decimals);
  const totalDepositBalance = bigIntChangeDecimals(poolSize.plus(totalBorrows), DEFAULT_DECIMALS, token.decimals);
  if (totalBalances.gt(BIGINT_ZERO)) {
    market.exchangeRate = bigIntToBDUseDecimals(totalDepositBalance, token.decimals).div(
      bigIntToBDUseDecimals(totalBalances, DEFAULT_DECIMALS),
    );
  }
  // tvl, totalDepositBalanceUSD and totalBorrowBalanceUSD may be updated again with new price
  updateBalances(token, protocol, market, totalBalances, totalBorrows, totalDepositBalance, totalBorrowBalance);

  if (interestRate.notEqual(assetStatus.interestRate)) {
    // update interest rates if `interestRate` or `reserveFee` changed
    updateInterestRates(market, interestRate, assetStatus.reserveFee, totalBorrows, totalBalances, event);
  }
  updateRevenue(reserveBalance, totalBalances, totalBorrows, protocol, market, assetStatus, event);
  snapshotMarket(event.block, marketId, BIGDECIMAL_ZERO, null);

  // update prices, tvl, totalDepositBalanceUSD, totalBorrowBalanceUSD every 75 blocks (~15 min)
  updateProtocolTVL(event, protocol);

  snapshotFinancials(event.block, BIGDECIMAL_ZERO, null, protocol);

  assetStatus.totalBorrows = totalBorrows;
  assetStatus.totalBalances = totalBalances;
  assetStatus.reserveBalance = reserveBalance;
  assetStatus.interestRate = interestRate;
  assetStatus.timestamp = event.params.timestamp;
  assetStatus.save();
}

function updateProtocolTVL(event: AssetStatus, protocol: LendingProtocol): void {
  if (event.block.number.ge(protocol._lastUpdateBlockNumber!.plus(BIGINT_SEVENTY_FIVE))) {
    const eulerContract = Euler.bind(Address.fromString(EULER_ADDRESS));
    const execProxyAddress = eulerContract.moduleIdToProxy(MODULEID__EXEC);
    let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    for (let i = 0; i < protocol._marketIDs!.length; i++) {
      const mrktID = protocol._marketIDs![i];
      const mrkt = getOrCreateMarket(mrktID);
      const tkn = getOrCreateToken(Address.fromString(mrkt.inputToken));
      const currPriceUSD = updatePrices(execProxyAddress, mrkt, event);
      const underlyingPriceUSD = currPriceUSD ? currPriceUSD : mrkt.inputTokenPriceUSD;
      // mark-to-market
      mrkt.totalDepositBalanceUSD = bigIntToBDUseDecimals(mrkt.inputTokenBalance, tkn.decimals).times(
        underlyingPriceUSD,
      );
      mrkt.totalBorrowBalanceUSD = bigIntToBDUseDecimals(mrkt._totalBorrowBalance!, tkn.decimals).times(
        underlyingPriceUSD,
      );

      mrkt.totalValueLockedUSD = mrkt.totalDepositBalanceUSD;
      mrkt.save();

      totalDepositBalanceUSD = totalDepositBalanceUSD.plus(mrkt.totalDepositBalanceUSD);
      totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(mrkt.totalBorrowBalanceUSD);
    }

    protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
    protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
    protocol.totalValueLockedUSD = totalDepositBalanceUSD;
    protocol._lastUpdateBlockNumber = event.block.number;
    protocol.save();
  }
}

function updateBalances(
  token: Token,
  protocol: LendingProtocol,
  market: Market,
  totalBalances: BigInt,
  totalBorrows: BigInt,
  totalDepositBalance: BigInt,
  totalBorrowBalance: BigInt,
): void {
  const newTotalDepositBalanceUSD = bigIntToBDUseDecimals(totalDepositBalance, token.decimals).times(
    token.lastPriceUSD!,
  );
  const newTotalBorrowBalanceUSD = bigIntToBDUseDecimals(totalBorrowBalance, token.decimals).times(token.lastPriceUSD!);
  protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD
    .plus(newTotalDepositBalanceUSD)
    .minus(market.totalDepositBalanceUSD);
  protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD
    .plus(newTotalBorrowBalanceUSD)
    .minus(market.totalBorrowBalanceUSD);
  protocol.totalValueLockedUSD = protocol.totalDepositBalanceUSD;
  protocol.save();

  market.totalDepositBalanceUSD = newTotalDepositBalanceUSD;

  market.totalBorrowBalanceUSD = newTotalBorrowBalanceUSD;
  market.totalValueLockedUSD = market.totalDepositBalanceUSD;

  market.inputTokenBalance = totalDepositBalance;
  market.outputTokenSupply = totalBalances;
  market._totalBorrowBalance = totalBorrowBalance;

  const dTokenAddress = Address.fromString(market._dToken!);
  const dToken = ERC20.bind(dTokenAddress);
  // these should always equal
  // totalBorrows == dTokenTotalSupply
  if (totalBorrows.gt(BIGINT_ZERO)) {
    const dTokenTotalSupply = dToken.totalSupply();
    if (dTokenTotalSupply.gt(BIGINT_ZERO)) {
      market._dTokenExchangeRate = bigIntToBDUseDecimals(totalBorrowBalance, token.decimals).div(
        bigIntToBDUseDecimals(dTokenTotalSupply, DEFAULT_DECIMALS),
      );
    }
  }
  market.save();
}

export function handleBorrow(event: Borrow): void {
  const borrowUSD = createBorrow(event);
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  updateUsageMetrics(event, event.params.account, TransactionType.BORROW);
  snapshotMarket(event.block, marketId, borrowUSD, TransactionType.BORROW);
  snapshotFinancials(event.block, borrowUSD, TransactionType.BORROW);
}

export function handleDeposit(event: Deposit): void {
  const depositUSD = createDeposit(event);
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  updateUsageMetrics(event, event.params.account, TransactionType.DEPOSIT);
  snapshotMarket(event.block, marketId, depositUSD, TransactionType.DEPOSIT);
  snapshotFinancials(event.block, depositUSD, TransactionType.DEPOSIT);
}

export function handleRepay(event: Repay): void {
  const repayUSD = createRepay(event);
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  updateUsageMetrics(event, event.params.account, TransactionType.REPAY);
  snapshotMarket(event.block, marketId, repayUSD, TransactionType.REPAY);
  snapshotFinancials(event.block, repayUSD, TransactionType.REPAY);
}

export function handleWithdraw(event: Withdraw): void {
  const withdrawUSD = createWithdraw(event);
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  updateUsageMetrics(event, event.params.account, TransactionType.WITHDRAW);
  snapshotMarket(event.block, marketId, withdrawUSD, TransactionType.WITHDRAW);
  snapshotFinancials(event.block, withdrawUSD, TransactionType.WITHDRAW);
}

export function handleLiquidation(event: Liquidation): void {
  const liquidateUSD = createLiquidation(event);
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
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
  const underlying = event.params.underlying.toHexString();
  const assetStatus = getOrCreateAssetStatus(underlying);
  const market = getOrCreateMarket(assetStatus.eToken!);
  market.maximumLTV = event.params.newConfig.collateralFactor.toBigDecimal().div(CONFIG_FACTOR_SCALE);
  market.liquidationThreshold = event.params.newConfig.borrowFactor.toBigDecimal().div(CONFIG_FACTOR_SCALE);
  if (market.maximumLTV.gt(BIGDECIMAL_ZERO)) {
    market.canUseAsCollateral = true;
  }
  market.save();
}

export function handleMarketActivated(event: MarketActivated): void {
  const underlyingToken = getOrCreateToken(event.params.underlying);
  const eToken = getOrCreateToken(event.params.eToken);
  const dToken = getOrCreateToken(event.params.dToken);

  const market = getOrCreateMarket(eToken.id);
  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;

  // Market are initialized in isolated tier, which means currency can't be used as collateral.
  // https://docs.euler.finance/risk-framework/tiers
  // for borrowIsolated tier assetConfig({borrowIsolated: true})
  // for cross tier assetConfig({borrowIsolated: false, collateralFactor: 0})
  // for collateral tier assetConfig({borrowIsolated: false, collateralFactor: > 0})
  market.canUseAsCollateral = false; //initial collateralFactor=0, reset in handleGovSetAssetConfig
  market.canBorrowFrom = true;

  market.name = eToken.name;
  market.inputToken = underlyingToken.id;
  market.outputToken = eToken.id;
  market._dToken = dToken.id;
  market.save();

  const assetStatus = getOrCreateAssetStatus(underlyingToken.id);
  assetStatus.eToken = eToken.id;
  assetStatus.dToken = dToken.id;
  assetStatus.save();
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
  const market = getOrCreateMarket(assetStatus.eToken!);
  updateInterestRates(
    market,
    assetStatus.interestRate,
    assetStatus.reserveFee,
    assetStatus.totalBorrows,
    assetStatus.totalBalances,
    event,
  );
}

export function handleStake(event: Stake): void {
  const underlying = event.params.underlying.toHexString();
  // find market id for underlying
  const assetStatus = getOrCreateAssetStatus(underlying);
  const marketId = assetStatus.eToken!;
  const market = getOrCreateMarket(marketId);
  const deltaStakedAmount = getDeltaStakeAmount(event);

  // keep track of staked amount from epoch 1
  const epochID = getCurrentEpoch(event);
  if (epochID < 0) {
    market._stakedAmount = market._stakedAmount.plus(deltaStakedAmount);
    market.save();
    return;
  }

  const epochStartBlock = getStartBlockForEpoch(epochID)!;
  let epoch = _Epoch.load(epochID.toString());
  if (!epoch) {
    //Start of a new epoch
    epoch = new _Epoch(epochID.toString());
    epoch.epoch = epochID;
    epoch.save();

    // rank markets use votes in prev epoch
    // find the top ten staked markets; according to the euler guage
    // https://app.euler.finance/gaugeweight
    // users "vote" for the next epoch
    const prevEpochID = epochID - 1;
    const prevEpoch = _Epoch.load(prevEpochID.toString());

    const protocol = getOrCreateLendingProtocol();
    if (prevEpoch) {
      // finalize mkt._weightedStakedAmount for prev epoch & distribute rewards
      // The array is needed to select top 10 staked markets
      const marketWeightedStakeAmounts: BigInt[] = [];
      for (let i = 0; i < protocol._marketIDs!.length; i++) {
        const mktID = protocol._marketIDs![i];
        const mkt = Market.load(mktID);
        if (!mkt) {
          log.error("[handleStake]market {} doesn't exist, but this should not happen | tx ={}", [
            mktID,
            event.transaction.hash.toHexString(),
          ]);
          continue;
        }
        const stakedAmount = mkt._stakedAmount;
        if (stakedAmount.gt(BIGINT_ZERO)) {
          // finalized mkt._weightedStakedAmount for the epoch just ended
          // epochStartBlock.minus(BIGINT_ONE) is the last block of prev epoch
          updateWeightedStakeAmount(mkt, epochStartBlock.minus(BIGINT_ONE));
        }
        marketWeightedStakeAmounts.push(mkt._weightedStakedAmount ? mkt._weightedStakedAmount! : BIGINT_ZERO);
        mkt.save();
      }

      const eulerContract = Euler.bind(Address.fromString(EULER_ADDRESS));
      const execProxyAddress = eulerContract.moduleIdToProxy(MODULEID__EXEC);
      // update EUL token prices
      updatePrices(execProxyAddress, market, event);

      // select top 10 staked markets, calculate sqrt(weighted staked amount)
      const cutoffAmount = getCutoffValue(marketWeightedStakeAmounts, 10);
      let sumAccumulator = BIGDECIMAL_ZERO;
      for (let i = 0; i < marketWeightedStakeAmounts.length; i++) {
        // TODO: reflect changes in eIP 24 and 28
        if (marketWeightedStakeAmounts[i].ge(cutoffAmount)) {
          sumAccumulator = sumAccumulator.plus(marketWeightedStakeAmounts[i].sqrt().toBigDecimal());
        }
      }
      const totalRewardAmount = BigDecimal.fromString((EUL_DIST[prevEpochID - START_EPOCH] * EUL_DECIMALS).toString());
      const EULToken = getOrCreateToken(Address.fromString(EUL_ADDRESS));
      const rewardToken = getOrCreateRewardToken(Address.fromString(EUL_ADDRESS), RewardTokenType.BORROW);
      // scale to daily emission amount
      const dailyScaler = BigDecimal.fromString((BLOCKS_PER_DAY / (BLOCKS_PER_EPOCH as f64)).toString());
      for (let i = 0; i < protocol._marketIDs!.length; i++) {
        const mktID = protocol._marketIDs![i];
        const mkt = Market.load(mktID);
        if (!mkt) {
          log.error("[handleStake]market {} doesn't exist, but this should not happen | tx ={}", [
            mktID,
            event.transaction.hash.toHexString(),
          ]);
          continue;
        }
        const mrktRewardToken = mkt.rewardTokens;
        if (!mrktRewardToken || mrktRewardToken.length == 0) {
          mkt.rewardTokens = [rewardToken.id];
        }
        // If prev epoch exists, distribute the rewards;
        // Only for epochs after the START_EPOCH (6)
        const _weightedStakedAmount = mkt._weightedStakedAmount;
        if (_weightedStakedAmount && _weightedStakedAmount.ge(cutoffAmount)) {
          const rewardTokenEmissionsAmount = BigDecimalTruncateToBigInt(
            _weightedStakedAmount.sqrt().divDecimal(sumAccumulator).times(totalRewardAmount).times(dailyScaler),
          );
          const rewardTokenEmissionsUSD = rewardTokenEmissionsAmount
            .divDecimal(BigDecimal.fromString(EUL_DECIMALS.toString()))
            .times(EULToken.lastPriceUSD!);
          mkt.rewardTokenEmissionsAmount = [rewardTokenEmissionsAmount];
          mkt.rewardTokenEmissionsUSD = [rewardTokenEmissionsUSD];
          mkt.save();
        }
      }
    }
  }

  // In a valid epoch (6 <= epoch <=96) with uninitialized market._stakeLastUpdateBlock
  if (!market._stakeLastUpdateBlock) {
    market._stakeLastUpdateBlock = epochStartBlock;
    market._weightedStakedAmount = BIGINT_ZERO;
  }
  // update _weightedStakeAmount before updating _stakedAmount
  updateWeightedStakeAmount(market, event.block.number);
  market._stakedAmount = market._stakedAmount.plus(deltaStakedAmount);
  market.save();
}
