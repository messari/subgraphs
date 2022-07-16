import { Address, BigDecimal, BigInt, Entity, ethereum, log } from "@graphprotocol/graph-ts";
import { Market, _MplReward, _StakeLocker } from "../../../../generated/schema";
import { PoolLib } from "../../../../generated/templates/Pool/PoolLib";

import { MAPLE_POOL_LIB_ADDRESS, SEC_PER_DAY, TEN_BD, ZERO_BD, ZERO_BI } from "../../constants";
import { getBptTokenAmountInUSD, getTokenAmountInUSD, getTokenPriceInUSD } from "../../prices/prices";
import { bigDecimalToBigInt, powBigDecimal, readCallResult } from "../../utils";
import { getOrCreateMarket, getOrCreateMplReward, getOrCreateStakeLocker } from "../getOrCreate/markets";
import { getOrCreateProtocol } from "../getOrCreate/protocol";
import {
    getOrCreateFinancialsDailySnapshot,
    getOrCreateMarketDailySnapshot,
    getOrCreateMarketHourlySnapshot
} from "../getOrCreate/snapshots";
import { getOrCreateRewardToken, getOrCreateToken } from "../getOrCreate/supporting";

function intervalUpdateMplReward(event: ethereum.Event, mplReward: _MplReward): void {
    const rewardActive = event.block.timestamp < mplReward.periodFinishedTimestamp;
    if (rewardActive) {
        mplReward.rewardTokenEmissionAmountPerDay = mplReward.rewardRatePerSecond.times(SEC_PER_DAY);
    } else {
        mplReward.rewardTokenEmissionAmountPerDay = ZERO_BI;
    }

    mplReward.lastUpdatedBlockNumber = event.block.number;
    mplReward.save();
}

function intervalUpdateStakeLocker(event: ethereum.Event, stakeLocker: _StakeLocker): void {
    const market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));
    const stakeToken = getOrCreateToken(Address.fromString(stakeLocker.stakeToken));
    const unrecognizedLosses = stakeLocker.cumulativeLosses.minus(stakeLocker.recognizedLosses);
    stakeLocker.stakeTokenBalance = stakeLocker.cumulativeStake
        .minus(stakeLocker.cumulativeUnstake)
        .minus(unrecognizedLosses);

    stakeLocker.stakeTokenBalanceUSD = getBptTokenAmountInUSD(event, stakeToken, stakeLocker.stakeTokenBalance);

    const poolLibContract = PoolLib.bind(MAPLE_POOL_LIB_ADDRESS);
    stakeLocker.stakeTokenSwapOutBalanceInPoolInputTokens = readCallResult(
        poolLibContract.try_getSwapOutValueLocker(
            Address.fromString(stakeLocker.stakeToken),
            Address.fromString(market.inputToken),
            Address.fromString(stakeLocker.id)
        ),
        ZERO_BI,
        poolLibContract.try_getSwapOutValueLocker.name
    );

    stakeLocker.lastUpdatedBlockNumber = event.block.number;
    stakeLocker.save();
}

function intervalUpdateMarket(event: ethereum.Event, market: Market): Market {
    const stakeLocker = getOrCreateStakeLocker(event, Address.fromString(market._stakeLocker));
    const inputToken = getOrCreateToken(Address.fromString(market.inputToken));
    const outputToken = getOrCreateToken(Address.fromString(market.outputToken));
    const lpMplReward = market._mplRewardMplLp
        ? getOrCreateMplReward(event, Address.fromString(<string>market._mplRewardMplLp))
        : null;
    const stakeMplReward = market._mplRewardMplStake
        ? getOrCreateMplReward(event, Address.fromString(<string>market._mplRewardMplStake))
        : null;

    market._totalDepositBalance = market._cumulativeDeposit
        .minus(market._cumulativeWithdraw)
        .minus(market._cumulativePoolLosses);

    market._totalInterestBalance = market._cumulativeInterest.minus(market._cumulativeInterestClaimed);

    market.inputTokenBalance = market._totalDepositBalance.plus(market._totalInterestBalance);

    market.outputTokenSupply = bigDecimalToBigInt(
        market._totalDepositBalance.toBigDecimal().div(market._initialExchangeRate)
    );

    market._cumulativeLiquidate = stakeLocker.cumulativeLossesInPoolInputToken.plus(market._cumulativePoolLosses);

    market._totalBorrowBalance = market._cumulativeBorrow
        .minus(market._cumulativePrincipalRepay)
        .minus(market._cumulativeLiquidate);

    if (market.outputTokenSupply.gt(ZERO_BI)) {
        market.exchangeRate = market.inputTokenBalance.toBigDecimal().div(market.outputTokenSupply.toBigDecimal());
    }

    market.inputTokenPriceUSD = getTokenPriceInUSD(event, inputToken);

    market.outputTokenPriceUSD = market.inputTokenPriceUSD
        .times(powBigDecimal(TEN_BD, outputToken.decimals - inputToken.decimals))
        .times(market.exchangeRate);

    const inputTokenBalanceUSD = getTokenAmountInUSD(event, inputToken, market.inputTokenBalance);
    market.totalValueLockedUSD = stakeLocker.stakeTokenBalanceUSD.plus(inputTokenBalanceUSD);

    market.totalDepositBalanceUSD = getTokenAmountInUSD(event, inputToken, market._totalDepositBalance);

    market.totalBorrowBalanceUSD = getTokenAmountInUSD(event, inputToken, market._totalBorrowBalance);

    market.cumulativeTotalRevenueUSD = market.cumulativeProtocolSideRevenueUSD.plus(
        market.cumulativeSupplySideRevenueUSD
    );

    let rewardTokenEmissionAmount = new Array<BigInt>();
    let rewardTokenEmissionUSD = new Array<BigDecimal>();
    for (let i = 0; i < market.rewardTokens.length; i++) {
        let tokenEmission = ZERO_BI;
        let tokenEmissionUSD = ZERO_BD;
        const rewardToken = getOrCreateRewardToken(Address.fromString(market.rewardTokens[i]));
        const rewardTokenToken = getOrCreateToken(Address.fromString(rewardToken.token));

        if (lpMplReward && (<_MplReward>lpMplReward).rewardToken == rewardToken.id) {
            tokenEmission = tokenEmission.plus((<_MplReward>lpMplReward).rewardTokenEmissionAmountPerDay);
        }

        if (stakeMplReward && (<_MplReward>stakeMplReward).rewardToken == rewardToken.id) {
            tokenEmission = tokenEmission.plus((<_MplReward>stakeMplReward).rewardTokenEmissionAmountPerDay);
        }

        tokenEmissionUSD = getTokenAmountInUSD(event, rewardTokenToken, tokenEmission);

        rewardTokenEmissionAmount.push(tokenEmission);
        rewardTokenEmissionUSD.push(tokenEmissionUSD);
    }
    market.rewardTokenEmissionsAmount = rewardTokenEmissionAmount;
    market.rewardTokenEmissionsUSD = rewardTokenEmissionUSD;

    market._lastUpdatedBlockNumber = event.block.number;

    market.save();

    return market;
}

function intervalUpdateProtocol(event: ethereum.Event, marketBefore: Market, marketAfter: Market): void {
    const protocol = getOrCreateProtocol();

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
        marketAfter.totalValueLockedUSD.minus(marketBefore.totalValueLockedUSD)
    );

    protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(
        marketAfter.totalDepositBalanceUSD.minus(marketBefore.totalDepositBalanceUSD)
    );

    protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD.plus(
        marketAfter.totalBorrowBalanceUSD.minus(marketBefore.totalBorrowBalanceUSD)
    );

    const deltaRevenueUSD = marketAfter.cumulativeTotalRevenueUSD.minus(marketBefore.cumulativeTotalRevenueUSD);
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(deltaRevenueUSD);

    ////
    // Update financial snapshot for dailyTotalRevenueUSD
    ////
    const financialsSnapshot = getOrCreateFinancialsDailySnapshot(event);
    financialsSnapshot.dailyTotalRevenueUSD = financialsSnapshot.dailyTotalRevenueUSD.plus(deltaRevenueUSD);
    financialsSnapshot.save();

    protocol.save();
}

export function intervalUpdateMarketHourlySnapshot(event: ethereum.Event, market: Market): void {
    const marketSnapshot = getOrCreateMarketHourlySnapshot(event, market);

    marketSnapshot.rates = market.rates;
    marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
    marketSnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketSnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
    marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketSnapshot.inputTokenBalance = market.inputTokenBalance;
    marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketSnapshot.outputTokenSupply = market.outputTokenSupply;
    marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketSnapshot.exchangeRate = market.exchangeRate;
    marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

    marketSnapshot.hourlyTotalRevenueUSD = marketSnapshot.hourlySupplySideRevenueUSD.plus(
        marketSnapshot.hourlyProtocolSideRevenueUSD
    );

    marketSnapshot.save();
    // Hourly accumulators are event driven updates
}

export function intervalUpdateMarketDailySnapshot(event: ethereum.Event, market: Market): void {
    const marketSnapshot = getOrCreateMarketDailySnapshot(event, market);

    marketSnapshot.rates = market.rates;
    marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
    marketSnapshot.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD;
    marketSnapshot.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD;
    marketSnapshot.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD;
    marketSnapshot.totalDepositBalanceUSD = market.totalDepositBalanceUSD;
    marketSnapshot.cumulativeDepositUSD = market.cumulativeDepositUSD;
    marketSnapshot.totalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    marketSnapshot.cumulativeBorrowUSD = market.cumulativeBorrowUSD;
    marketSnapshot.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    marketSnapshot.inputTokenBalance = market.inputTokenBalance;
    marketSnapshot.inputTokenPriceUSD = market.inputTokenPriceUSD;
    marketSnapshot.outputTokenSupply = market.outputTokenSupply;
    marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;
    marketSnapshot.exchangeRate = market.exchangeRate;
    marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

    marketSnapshot.dailyTotalRevenueUSD = marketSnapshot.dailySupplySideRevenueUSD.plus(
        marketSnapshot.dailyProtocolSideRevenueUSD
    );

    marketSnapshot.save();
    // Daily accumulators are event driven updates
}

export function intervalUpdateFinancialsDailySnapshot(event: ethereum.Event): void {
    const protocol = getOrCreateProtocol();
    const financialsSnapshot = getOrCreateFinancialsDailySnapshot(event);

    financialsSnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialsSnapshot.protocolControlledValueUSD = protocol.protocolControlledValueUSD;
    financialsSnapshot.mintedTokenSupplies = protocol.mintedTokenSupplies;
    financialsSnapshot.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialsSnapshot.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialsSnapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    financialsSnapshot.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD;
    financialsSnapshot.cumulativeDepositUSD = protocol.cumulativeDepositUSD;
    financialsSnapshot.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD;
    financialsSnapshot.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD;
    financialsSnapshot.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD;
    financialsSnapshot._treasuryFee = protocol._treasuryFee;

    financialsSnapshot.save();
    // Daily accumulators are event driven updates
}

/**
 * Trigger an interval update for this market
 * This does the following
 * 1. interval update the market (mplRewards + stakeLocker + market)
 * 2. interval update the protocol
 * 3. update snapshots
 */
export function intervalUpdate(event: ethereum.Event, market: Market): void {
    ////
    // Interval update MplReward's
    ////
    if (market._mplRewardMplLp) {
        const lpMplReward = getOrCreateMplReward(event, Address.fromString(<string>market._mplRewardMplLp));
        intervalUpdateMplReward(event, lpMplReward);
    }
    if (market._mplRewardMplStake) {
        const stakeMplReward = getOrCreateMplReward(event, Address.fromString(<string>market._mplRewardMplStake));
        intervalUpdateMplReward(event, stakeMplReward);
    }

    ////
    // Interval update stakeLocker
    ////
    const stakeLocker = getOrCreateStakeLocker(event, Address.fromString(market._stakeLocker));
    intervalUpdateStakeLocker(event, stakeLocker);

    ////
    // Interval update market
    ////
    // Use a copy instead of original as to hold before and after for intervalUpdateProtocol
    const marketAfter = getOrCreateMarket(event, Address.fromString(market.id));
    intervalUpdateMarket(event, marketAfter);

    // If market hasn't already been updated this block
    ////
    // Interval update protocol
    ////
    intervalUpdateProtocol(event, market, marketAfter);

    ////
    // Interval update market snapshots
    ////
    intervalUpdateMarketHourlySnapshot(event, market);
    intervalUpdateMarketDailySnapshot(event, market);

    ////
    // Interval update financials snapshot
    ////
    intervalUpdateFinancialsDailySnapshot(event);
}
