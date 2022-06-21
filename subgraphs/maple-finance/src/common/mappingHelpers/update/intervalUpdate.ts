import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Market, _MplReward, _StakeLocker } from "../../../../generated/schema";
import { PoolLib } from "../../../../generated/templates/Pool/PoolLib";

import { MAPLE_POOL_LIB_ADDRESS, SEC_PER_DAY, TEN_BD, ZERO_BD, ZERO_BI } from "../../constants";
import { getTokenAmountInUSD, getTokenPriceInUSD } from "../../prices/prices";
import { bigDecimalToBigInt, powBigDecimal, readCallResult } from "../../utils";
import { getOrCreateMarket, getOrCreateMplReward, getOrCreateStakeLocker } from "../getOrCreate/markets";
import { getOrCreateProtocol } from "../getOrCreate/protocol";
import { getOrCreateRewardToken, getOrCreateToken } from "../getOrCreate/supporting";

function intervalUpdateMplReward(event: ethereum.Event, mplReward: _MplReward): void {
    if (mplReward.lastUpdatedBlockNumber != event.block.number) {
        const rewardActive = event.block.timestamp < mplReward.periodFinishedTimestamp;
        if (rewardActive) {
            mplReward.rewardTokenEmissionAmountPerDay = mplReward.rewardRatePerSecond.times(SEC_PER_DAY);
        } else {
            mplReward.rewardTokenEmissionAmountPerDay = ZERO_BI;
        }

        mplReward.lastUpdatedBlockNumber = event.block.number;
        mplReward.save();
    }
}

function intervalUpdateStakeLocker(event: ethereum.Event, stakeLocker: _StakeLocker): void {
    if (stakeLocker.lastUpdatedBlockNumber != event.block.number) {
        const market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));
        stakeLocker.stakeTokenBalance = stakeLocker.cumulativeStake
            .minus(stakeLocker.cumulativeUnstake)
            .minus(stakeLocker.cumulativeLosses);

        const poolLibContract = PoolLib.bind(MAPLE_POOL_LIB_ADDRESS);
        stakeLocker.stakeTokenBalanceInPoolInputTokens = readCallResult(
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
}

function intervalUpdateMarket(event: ethereum.Event, market: Market): Market {
    if (market._lastUpdatedBlockNumber != event.block.number) {
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

        market._totalInterstBalance = market._cumulativeInterest.minus(market._cumulativeInterestClaimed);

        market.inputTokenBalance = market._totalDepositBalance.plus(market._totalInterstBalance);

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

        market.totalValueLockedUSD = getTokenAmountInUSD(
            event,
            inputToken,
            market.inputTokenBalance.plus(stakeLocker.stakeTokenBalanceInPoolInputTokens)
        );

        market.totalDepositBalanceUSD = getTokenAmountInUSD(event, inputToken, market._totalDepositBalance);

        market.cumulativeDepositUSD = getTokenAmountInUSD(event, inputToken, market._cumulativeDeposit);

        market.totalBorrowBalanceUSD = getTokenAmountInUSD(event, inputToken, market._totalBorrowBalance);

        market.cumulativeBorrowUSD = getTokenAmountInUSD(event, inputToken, market._cumulativeBorrow);

        market.cumulativeLiquidateUSD = getTokenAmountInUSD(event, inputToken, market._cumulativeLiquidate);

        const cumulativeSupplySideRevenue = market._cumulativePoolDelegateRevenue
            .plus(market._cumulativeInterest)
            .plus(stakeLocker.cumulativeInterestInPoolInputTokens);
        market._cumulativeSupplySideRevenueUSD = getTokenAmountInUSD(event, inputToken, cumulativeSupplySideRevenue);

        market._cumulativeProtocolSideRevenueUSD = getTokenAmountInUSD(
            event,
            inputToken,
            market._cumulativeTreasuryRevenue
        );

        market._cumulativeTotalRevenueUSD = market._cumulativeProtocolSideRevenueUSD.plus(
            market._cumulativeSupplySideRevenueUSD
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
    }

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

    protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(
        marketAfter.cumulativeDepositUSD.minus(marketBefore.cumulativeDepositUSD)
    );

    protocol.totalBorrowBalanceUSD = protocol.totalBorrowBalanceUSD.plus(
        marketAfter.totalBorrowBalanceUSD.minus(marketBefore.totalBorrowBalanceUSD)
    );

    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(
        marketAfter.cumulativeBorrowUSD.minus(marketBefore.cumulativeBorrowUSD)
    );

    protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(
        marketAfter.cumulativeLiquidateUSD.minus(marketBefore.cumulativeLiquidateUSD)
    );

    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
        marketAfter._cumulativeSupplySideRevenueUSD.minus(marketBefore._cumulativeSupplySideRevenueUSD)
    );

    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
        marketAfter._cumulativeProtocolSideRevenueUSD.minus(marketBefore._cumulativeProtocolSideRevenueUSD)
    );

    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
        marketAfter._cumulativeTotalRevenueUSD.minus(marketBefore._cumulativeTotalRevenueUSD)
    );

    protocol.save();
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
    const marketAfter = intervalUpdateMarket(event, market);

    ////
    // Interval update protocol
    ////
    if (market._lastUpdatedBlockNumber != event.block.number) {
        intervalUpdateProtocol(event, market, marketAfter);
    }

    ////
    // Update market snapshots
    ////
    // TODO(spperkins)

    ////
    // Update financials snapshots
    ////
    // TODO(spperkins)
}
