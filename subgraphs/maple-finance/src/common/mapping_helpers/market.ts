import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Market, _MplReward, _PoolFactory, _StakeLocker } from "../../../generated/schema";

import { POOL_WAD_DECIMALS, PROTOCOL_ID, UNPROVIDED_NAME, ZERO_ADDRESS, ZERO_BD, ZERO_BI, TEN_BD } from "../constants";
import { getTokenPriceInUSD } from "../prices/prices";
import { parseUnits, powBigDecimal } from "../utils";
import { getOrCreateMplReward, mplRewardTick } from "./mplReward";
import { getOrCreateProtocol, updateFinancialMetrics } from "./protocol";
import { getOrCreateStakeLocker, stakeLockerTick } from "./stakeLocker";
import { getOrCreateToken } from "./token";

/**
 * Get the market at marketAddress, or create it if it doesn't exist
 * Only marketAddresss is required for get, everything should be set for create
 */
export function getOrCreateMarket(
    marketAddress: Address,
    marketName: string = UNPROVIDED_NAME,
    poolFactoryAddress: Address = ZERO_ADDRESS,
    delegateAddress: Address = ZERO_ADDRESS,
    stakeLockerAddress: Address = ZERO_ADDRESS,
    inputTokenAddress: Address = ZERO_ADDRESS,
    outputTokenAddress: Address = ZERO_ADDRESS,
    creationTimestamp: BigInt = ZERO_BI,
    creationBlockNumber: BigInt = ZERO_BI
): Market {
    let market = Market.load(marketAddress.toHexString());

    if (!market) {
        market = new Market(marketAddress.toHexString());

        const inputToken = getOrCreateToken(inputTokenAddress);

        // Following _toWad function
        const initalExchangeRate = powBigDecimal(TEN_BD, inputToken.decimals).div(
            powBigDecimal(TEN_BD, POOL_WAD_DECIMALS)
        );

        market.protocol = PROTOCOL_ID;
        market.name = marketName;
        market.isActive = false;
        market.canUseAsCollateral = false;
        market.canBorrowFrom = false;
        market.maximumLTV = ZERO_BD;
        market.liquidationThreshold = ZERO_BD;
        market.liquidationPenalty = ZERO_BD;
        market.inputToken = inputTokenAddress.toHexString();
        market.outputToken = outputTokenAddress.toHexString();
        market.rewardTokens = [];
        market.rates = [];
        market.totalValueLockedUSD = ZERO_BD;
        market.totalDepositBalanceUSD = ZERO_BD;
        market.cumulativeDepositUSD = ZERO_BD;
        market.totalBorrowBalanceUSD = ZERO_BD;
        market.cumulativeBorrowUSD = ZERO_BD;
        market.cumulativeLiquidateUSD = ZERO_BD;
        market.inputTokenBalance = ZERO_BI;
        market.inputTokenPriceUSD = ZERO_BD;
        market.outputTokenSupply = ZERO_BI;
        market.outputTokenPriceUSD = ZERO_BD;
        market.exchangeRate = initalExchangeRate;
        market.rewardTokenEmissionsAmount = [];
        market.rewardTokenEmissionsUSD = [];
        market.createdTimestamp = creationTimestamp;
        market.createdBlockNumber = creationBlockNumber;
        market._poolFactory = poolFactoryAddress.toHexString();
        market._delegateAddress = delegateAddress.toHexString();
        market._stakeLocker = stakeLockerAddress.toHexString();
        market._cumulativeDeposit = ZERO_BI;
        market._totalBorrowBalance = ZERO_BI;
        market._cumulativeBorrow = ZERO_BI;
        market._cumulativePoolDefault = ZERO_BI;
        market._cumulativeCollatoralLiquidationInPoolInputTokens = ZERO_BI;
        market._poolDelegateRevenue = ZERO_BI;
        market._poolDelegateRevenueUSD = ZERO_BD;
        market._treasuryRevenue = ZERO_BI;
        market._treasuryRevenueUSD = ZERO_BD;
        market._supplierRevenue = ZERO_BI;
        market._supplierRevenueUSD = ZERO_BD;
        market._protocolSideRevenueUSD = ZERO_BD;
        market._totalRevenueUSD = ZERO_BD;

        // No maple rewards pools to begin with, they get added on MplRewards.sol->MplRewardsCreated
        market._mplRewardMplLp = null;
        market._mplRewardMplStake = null;

        market.save();

        if (
            UNPROVIDED_NAME == marketName ||
            ZERO_ADDRESS == poolFactoryAddress ||
            ZERO_ADDRESS == delegateAddress ||
            ZERO_ADDRESS == stakeLockerAddress ||
            ZERO_ADDRESS == inputTokenAddress ||
            ZERO_ADDRESS == outputTokenAddress ||
            ZERO_BI == creationTimestamp ||
            ZERO_BI == creationBlockNumber
        ) {
            log.error(
                "Created market with invalid params: marketName={}, poolFactoryAddress={}, delegateAddress={}, stakeLockerAddress={}, inputTokenAddress={}, outputTokenAddress={}, creationTimestamp={}, creationBlockNumber={{",
                [
                    marketName,
                    poolFactoryAddress.toHexString(),
                    delegateAddress.toHexString(),
                    stakeLockerAddress.toHexString(),
                    inputTokenAddress.toHexString(),
                    outputTokenAddress.toHexString(),
                    creationTimestamp.toString(),
                    creationBlockNumber.toString()
                ]
            );
        }
    }

    return market;
}

/**
 * Function which should get called every update of the market
 */
export function marketTick(market: Market, event: ethereum.Event): void {
    ////
    // update market prices
    ////
    const inputToken = getOrCreateToken(Address.fromString(market.inputToken));
    const outputToken = getOrCreateToken(Address.fromString(market.outputToken));
    market.inputTokenPriceUSD = getTokenPriceInUSD(inputToken, event);

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
        lpMplReward = getOrCreateMplReward(Address.fromString(<string>market._mplRewardMplLp));
        mplRewardTick(<_MplReward>lpMplReward, event);
    }

    if (market._mplRewardMplStake) {
        stakeMplReward = getOrCreateMplReward(Address.fromString(<string>market._mplRewardMplStake));
        mplRewardTick(<_MplReward>stakeMplReward, event);
    }

    ////
    // Trigger stakeLocker tick
    ////
    const stakeLocker = getOrCreateStakeLocker(Address.fromString(market._stakeLocker));
    stakeLockerTick(stakeLocker, event);

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
    market.totalValueLockedUSD = parseUnits(
        market.inputTokenBalance.plus(stakeLocker.stakeTokenBalanceInPoolInputTokens),
        inputToken.decimals
    ).times(market.inputTokenPriceUSD);

    market.totalDepositBalanceUSD = parseUnits(market.inputTokenBalance, inputToken.decimals).times(
        market.inputTokenPriceUSD
    );

    market.cumulativeDepositUSD = parseUnits(market._cumulativeDeposit, inputToken.decimals).times(
        market.inputTokenPriceUSD
    );

    market.totalBorrowBalanceUSD = parseUnits(market._totalBorrowBalance, inputToken.decimals).times(
        market.inputTokenPriceUSD
    );

    market.cumulativeBorrowUSD = parseUnits(market._cumulativeBorrow, inputToken.decimals).times(
        market.inputTokenPriceUSD
    );

    const cumulativeLiquidate = market._cumulativePoolDefault
        .plus(market._cumulativeCollatoralLiquidationInPoolInputTokens)
        .plus(stakeLocker.cumulativeStakeDefaultInPoolInputTokens);
    market.cumulativeLiquidateUSD = parseUnits(cumulativeLiquidate, inputToken.decimals).times(
        market.inputTokenPriceUSD
    );

    market._poolDelegateRevenueUSD = parseUnits(market._poolDelegateRevenue, inputToken.decimals).times(
        market.inputTokenPriceUSD
    );

    market._treasuryRevenueUSD = parseUnits(market._treasuryRevenue, inputToken.decimals).times(
        market.inputTokenPriceUSD
    );

    market._supplierRevenueUSD = parseUnits(market._supplierRevenue, inputToken.decimals).times(
        market.inputTokenPriceUSD
    );

    market._supplySideRevenueUSD = market._supplierRevenueUSD
        .plus(market._poolDelegateRevenueUSD)
        .plus(stakeLocker.revenueUSD);

    market._protocolSideRevenueUSD = market._treasuryRevenueUSD;

    market._totalRevenueUSD = market._protocolSideRevenueUSD.plus(market._supplySideRevenueUSD);

    let rewardTokenEmissionAmount: BigInt[] = [];
    let rewardTokenEmissionUSD: BigDecimal[] = [];
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
