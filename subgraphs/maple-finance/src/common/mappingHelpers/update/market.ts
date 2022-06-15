import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

import { Market, _MplReward, _StakeLocker } from "../../../../generated/schema";
import { PoolLib } from "../../../../generated/templates/Pool/PoolLib";

import { MAPLE_POOL_LIB_ADDRESS, ONE_BI, SEC_PER_DAY, TEN_BD, ZERO_BD, ZERO_BI } from "../../constants";
import { getTokenAmountInUSD, getTokenPriceInUSD } from "../../prices/prices";
import { bigDecimalToBigInt, computeNewAverage, powBigDecimal } from "../../utils";
import { getOrCreateMarket, getOrCreateMplReward, getOrCreateStakeLocker } from "../getOrCreate/markets";
import { getOrCreateMarketDailySnapshot } from "../getOrCreate/snapshots";
import { getOrCreateProtocol } from "../getOrCreate/protocol";
import { getOrCreateToken } from "../getOrCreate/supporting";
import { updateFinancialMetrics, updateMarketHourlySnapshots } from "./snapshots";

/**
 * Function which should get called every update of the market
 */
export function marketTick(market: Market, event: ethereum.Event): void {
    ////
    // update market prices
    ////
    const inputToken = getOrCreateToken(Address.fromString(market.inputToken));
    const outputToken = getOrCreateToken(Address.fromString(market.outputToken));
    market.inputTokenPriceUSD = getTokenPriceInUSD(event, inputToken);

    if (market.outputTokenSupply.gt(ZERO_BI)) {
        market.exchangeRate = market.inputTokenBalance.toBigDecimal().div(market.outputTokenSupply.toBigDecimal());
    }

    if (market.exchangeRate.gt(ZERO_BD)) {
        market.outputTokenPriceUSD = market.inputTokenPriceUSD
            .div(powBigDecimal(TEN_BD, inputToken.decimals)) // USD per input token mantissa
            .times(market.exchangeRate) // USD per output token mantissa
            .times(powBigDecimal(TEN_BD, outputToken.decimals)); // USD per output token
    } else {
        market.outputTokenPriceUSD = ZERO_BD;
    }

    let lpMplReward: _MplReward | null = null;
    let stakeMplReward: _MplReward | null = null;

    ////
    // Trigger mplReward's tick
    ////
    if (market._mplRewardMplLp) {
        lpMplReward = getOrCreateMplReward(event, Address.fromString(<string>market._mplRewardMplLp));
        mplRewardTick(<_MplReward>lpMplReward, event);
    }

    if (market._mplRewardMplStake) {
        stakeMplReward = getOrCreateMplReward(event, Address.fromString(<string>market._mplRewardMplStake));
        mplRewardTick(<_MplReward>stakeMplReward, event);
    }

    ////
    // Trigger stakeLocker tick
    ////
    const stakeLocker = getOrCreateStakeLocker(event, Address.fromString(market._stakeLocker));
    stakeLockerTick(event, stakeLocker);

    ////
    // Store old market cumulatives needed protocol update
    ////
    const oldMarketTotalValueLocked = market.totalValueLockedUSD;
    const oldMarketTotalDepositBalanceUSD = market.totalDepositBalanceUSD;
    const oldMarketCumulativeDepositUSD = market.cumulativeDepositUSD;
    const oldMarketTotalBorrowBalanceUSD = market.totalBorrowBalanceUSD;
    const oldMarketCumulativeBorrowUSD = market.cumulativeBorrowUSD;
    const oldMarketCumulativeLiquidateUSD = market.cumulativeLiquidateUSD;
    const oldMarketCumulativeSupplySideRevenueUSD = market._supplySideRevenueUSD;
    const oldMarketProtocolSideRevenue = market._protocolSideRevenueUSD;
    const oldMarketTotalRevenueUSD = market._totalRevenueUSD;

    ////
    // Update market cumulatives
    ////
    market.totalValueLockedUSD = getTokenAmountInUSD(
        event,
        inputToken,
        market.inputTokenBalance.plus(stakeLocker.stakeTokenBalanceInPoolInputTokens)
    );

    market.totalDepositBalanceUSD = getTokenAmountInUSD(event, inputToken, market.inputTokenBalance);

    market.cumulativeDepositUSD = getTokenAmountInUSD(event, inputToken, market._cumulativeDeposit);

    market.totalBorrowBalanceUSD = getTokenAmountInUSD(event, inputToken, market._totalBorrowBalance);

    market.cumulativeBorrowUSD = getTokenAmountInUSD(event, inputToken, market._cumulativeBorrow);

    const cumulativeLiquidate = market._cumulativePoolDefault
        .plus(market._cumulativeCollatoralLiquidationInPoolInputTokens)
        .plus(stakeLocker.cumulativeStakeDefaultInPoolInputTokens);
    market.cumulativeLiquidateUSD = getTokenAmountInUSD(event, inputToken, cumulativeLiquidate);

    market._poolDelegateRevenueUSD = getTokenAmountInUSD(event, inputToken, market._poolDelegateRevenue);

    market._treasuryRevenueUSD = getTokenAmountInUSD(event, inputToken, market._treasuryRevenue);

    market._supplierRevenueUSD = getTokenAmountInUSD(event, inputToken, market._supplierRevenue);

    market._supplySideRevenueUSD = market._supplierRevenueUSD
        .plus(market._poolDelegateRevenueUSD)
        .plus(stakeLocker.revenueUSD);

    market._protocolSideRevenueUSD = market._treasuryRevenueUSD;

    market._totalRevenueUSD = market._protocolSideRevenueUSD.plus(market._supplySideRevenueUSD);

    let rewardTokenEmissionAmount = new Array<BigInt>();
    let rewardTokenEmissionUSD = new Array<BigDecimal>();
    for (let i = 0; i < market.rewardTokens.length; i++) {
        let tokenEmission = ZERO_BI;
        let tokenEmissionUSD = ZERO_BD;
        const rewardToken = market.rewardTokens[i];

        if (lpMplReward && (<_MplReward>lpMplReward).rewardToken == rewardToken) {
            tokenEmission = tokenEmission.plus(lpMplReward.rewardTokenEmissionAmountPerDay);
            tokenEmissionUSD = tokenEmissionUSD.plus(lpMplReward.rewardTokenEmissionsUSDPerDay);
        }

        if (stakeMplReward && (<_MplReward>stakeMplReward).rewardToken == rewardToken) {
            tokenEmission = tokenEmission.plus(stakeMplReward.rewardTokenEmissionAmountPerDay);
            tokenEmissionUSD = tokenEmissionUSD.plus(stakeMplReward.rewardTokenEmissionsUSDPerDay);
        }

        rewardTokenEmissionAmount.push(tokenEmission);
        rewardTokenEmissionUSD.push(tokenEmissionUSD);
    }
    market.rewardTokenEmissionsAmount = rewardTokenEmissionAmount;
    market.rewardTokenEmissionsUSD = rewardTokenEmissionUSD;

    market.save();

    ////
    // Update market snapshots, must come after updating market cumulatives
    ////
    updateMarketDailySnapshots(market, event);
    updateMarketHourlySnapshots(market, event);

    ////
    // Update protocol cumulatives
    ////
    const protocol = getOrCreateProtocol();

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
        market.totalValueLockedUSD.minus(oldMarketTotalValueLocked)
    );

    protocol.totalDepositBalanceUSD = protocol.totalDepositBalanceUSD.plus(
        market.totalDepositBalanceUSD.minus(oldMarketTotalDepositBalanceUSD)
    );

    protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(
        market.cumulativeDepositUSD.minus(oldMarketCumulativeDepositUSD)
    );

    protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD.plus(
        market.totalBorrowBalanceUSD.minus(oldMarketTotalBorrowBalanceUSD)
    );

    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(
        market.cumulativeBorrowUSD.minus(oldMarketCumulativeBorrowUSD)
    );

    protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(
        market.cumulativeLiquidateUSD.minus(oldMarketCumulativeLiquidateUSD)
    );

    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
        market._supplySideRevenueUSD.minus(oldMarketCumulativeSupplySideRevenueUSD)
    );

    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
        market._protocolSideRevenueUSD.minus(oldMarketProtocolSideRevenue)
    );

    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
        market._totalRevenueUSD.minus(oldMarketTotalRevenueUSD)
    );

    protocol.save();

    // Update financial metrics, must come after updating protocol
    updateFinancialMetrics(event);
}

/**
 * Function which should get called on every update of the market this belongs to
 * Note: this should be called after the market has updated inputTokenPriceUSD
 */
export function stakeLockerTick(event: ethereum.Event, stakeLocker: _StakeLocker): void {
    // Update only if it hasn't been updated this block
    if (stakeLocker.lastUpdatedBlockNumber != event.block.number) {
        const market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));
        const marketInputToken = getOrCreateToken(Address.fromString(market.inputToken));

        const poolLibContract = PoolLib.bind(MAPLE_POOL_LIB_ADDRESS);
        const swapOutValueCall = poolLibContract.try_getSwapOutValueLocker(
            Address.fromString(stakeLocker.stakeToken),
            Address.fromString(market.inputToken),
            Address.fromString(stakeLocker.id)
        );

        if (swapOutValueCall.reverted) {
            log.error("swapOutValueCall({}, {}, {}) reverted", [
                stakeLocker.stakeToken,
                market.inputToken,
                stakeLocker.id
            ]);
        } else {
            stakeLocker.cumulativeStakeDefaultInPoolInputTokens = swapOutValueCall.value;
        }

        if (stakeLocker.stakeTokenBalance.notEqual(ZERO_BI)) {
            stakeLocker.stakeTokenPriceUSD = stakeLocker.stakeTokenBalanceInPoolInputTokens
                .toBigDecimal()
                .times(market.inputTokenPriceUSD)
                .div(stakeLocker.stakeTokenBalance.toBigDecimal());
        }

        stakeLocker.revenueUSD = getTokenAmountInUSD(event, marketInputToken, stakeLocker.revenueInPoolInputTokens);

        stakeLocker.lastUpdatedBlockNumber = event.block.number;
        stakeLocker.save();
    }
}

/**
 * Function which should get called on every update of the market this belongs to
 */
export function mplRewardTick(mplReward: _MplReward, event: ethereum.Event): void {
    // Update only if it hasn't been updated this block
    if (mplReward.lastUpdatedBlockNumber != event.block.number) {
        const rewardActive = event.block.timestamp < mplReward.periodFinishedTimestamp;
        if (rewardActive) {
            mplReward.rewardTokenEmissionAmountPerDay = mplReward.rewardRatePerSecond.times(SEC_PER_DAY);
        } else {
            mplReward.rewardTokenEmissionAmountPerDay = ZERO_BI;
        }

        const rewardToken = getOrCreateToken(Address.fromString(mplReward.rewardToken)); // Actual token instead of RewardToken
        mplReward.rewardTokenEmissionsUSDPerDay = getTokenAmountInUSD(
            event,
            rewardToken,
            mplReward.rewardTokenEmissionAmountPerDay
        );

        mplReward.lastUpdatedBlockNumber = event.block.number;
        mplReward.save();
    }
}

function updateMarketDailySnapshots(market: Market, event: ethereum.Event): void {
    const marketSnapshot = getOrCreateMarketDailySnapshot(market, event);

    ////
    // Update direct copies
    ////
    marketSnapshot.rates = market.rates;
    marketSnapshot.rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    marketSnapshot.rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

    ////
    // Update averages
    ////
    const txCount = marketSnapshot._txCount;

    marketSnapshot.totalValueLockedUSD = computeNewAverage(
        marketSnapshot.totalValueLockedUSD,
        txCount,
        market.totalValueLockedUSD
    );

    marketSnapshot.totalDepositBalanceUSD = computeNewAverage(
        marketSnapshot.totalDepositBalanceUSD,
        txCount,
        market.totalDepositBalanceUSD
    );

    marketSnapshot.cumulativeDepositUSD = computeNewAverage(
        marketSnapshot.cumulativeDepositUSD,
        txCount,
        market.cumulativeDepositUSD
    );

    marketSnapshot.cumulativeBorrowUSD = computeNewAverage(
        marketSnapshot.cumulativeBorrowUSD,
        txCount,
        market.cumulativeBorrowUSD
    );

    marketSnapshot.cumulativeLiquidateUSD = computeNewAverage(
        marketSnapshot.cumulativeLiquidateUSD,
        txCount,
        market.cumulativeLiquidateUSD
    );

    marketSnapshot.inputTokenBalance = bigDecimalToBigInt(
        computeNewAverage(
            marketSnapshot.inputTokenBalance.toBigDecimal(),
            txCount,
            market.inputTokenBalance.toBigDecimal()
        )
    );

    marketSnapshot.inputTokenPriceUSD = computeNewAverage(
        marketSnapshot.inputTokenPriceUSD,
        txCount,
        market.inputTokenPriceUSD
    );

    marketSnapshot.outputTokenSupply = bigDecimalToBigInt(
        computeNewAverage(
            marketSnapshot.outputTokenSupply.toBigDecimal(),
            txCount,
            market.outputTokenSupply.toBigDecimal()
        )
    );

    marketSnapshot.outputTokenPriceUSD = computeNewAverage(
        marketSnapshot.outputTokenPriceUSD,
        txCount,
        market.outputTokenPriceUSD
    );

    marketSnapshot.exchangeRate = computeNewAverage(marketSnapshot.exchangeRate, txCount, market.exchangeRate);

    ////
    // Update snapshot cumulatives
    ////
    marketSnapshot.dailyDepositUSD = market.totalDepositBalanceUSD.minus(marketSnapshot._initialDepositUSD);
    marketSnapshot.dailyBorrowUSD = market.totalBorrowBalanceUSD.minus(marketSnapshot._initialBorrowUSD);
    marketSnapshot.dailyLiquidateUSD = market.cumulativeLiquidateUSD.minus(marketSnapshot._initialLiquidateUSD);

    ////
    // Update tx count
    ////
    marketSnapshot._txCount = txCount.plus(ONE_BI);

    marketSnapshot.save();
}
