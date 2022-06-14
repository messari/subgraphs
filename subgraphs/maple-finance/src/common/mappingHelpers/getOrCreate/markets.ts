import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";

import { Market, _Loan, _MplReward, _StakeLocker } from "../../../../generated/schema";
import { LoanV2OrV3 as LoanV2OrV3Contract } from "../../../../generated/templates/LoanV2OrV3/LoanV2OrV3";
import { LoanV1 as LoanV1Contract } from "../../../../generated/templates/LoanV1/LoanV1";
import { Pool as PoolContract } from "../../../../generated/templates/Pool/Pool";
import { StakeLocker as StakeLockerContract } from "../../../../generated/templates/StakeLocker/StakeLocker";
import { MplReward as MplRewardContract } from "../../../../generated/templates/MplReward/MplReward";

import {
    LoanVersion,
    MPL_REWARDS_DEFAULT_DURATION_TIME_S,
    POOL_WAD_DECIMALS,
    PROTOCOL_ID,
    SEC_PER_DAY,
    TEN_BD,
    ZERO_ADDRESS,
    ZERO_BD,
    ZERO_BI
} from "../../constants";
import { bigDecimalToBigInt, parseUnits, powBigDecimal, readCallResult } from "../../utils";
import { getOrCreateRewardToken, getOrCreateToken } from "./supporting";

/**
 * Get the market at marketAddress, or create it if it doesn't exist
 */
export function getOrCreateMarket(event: ethereum.Event, marketAddress: Address): Market {
    let market = Market.load(marketAddress.toHexString());

    if (!market) {
        market = new Market(marketAddress.toHexString());

        const poolContract = PoolContract.bind(marketAddress);

        poolContract.try_name;

        const marketName = readCallResult(poolContract.try_name(), "UNDEFINED", poolContract.try_name.name);

        const poolFactoryAddress = readCallResult(
            poolContract.try_superFactory(),
            ZERO_ADDRESS,
            poolContract.try_superFactory.name
        );

        const delegateAddress = readCallResult(
            poolContract.try_poolDelegate(),
            ZERO_ADDRESS,
            poolContract.try_poolDelegate.name
        );

        const stakeLockerAddress = readCallResult(
            poolContract.try_stakeLocker(),
            ZERO_ADDRESS,
            poolContract.try_stakeLocker.name
        );

        const inputTokenAddress = readCallResult(
            poolContract.try_liquidityAsset(),
            ZERO_ADDRESS,
            poolContract.try_liquidityAsset.name
        );

        const inputToken = getOrCreateToken(inputTokenAddress);

        // Following _toWad function
        market._initialExchangeRate = powBigDecimal(TEN_BD, inputToken.decimals).div(
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
        market.outputToken = market.id;
        market.rewardTokens = new Array<string>();
        market.rates = new Array<string>();
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
        market.exchangeRate = market._initialExchangeRate;
        market.rewardTokenEmissionsAmount = new Array<BigInt>();
        market.rewardTokenEmissionsUSD = new Array<BigDecimal>();
        market.createdTimestamp = event.block.timestamp;
        market.createdBlockNumber = event.block.number;

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
        market._supplySideRevenueUSD = ZERO_BD;
        market._protocolSideRevenueUSD = ZERO_BD;
        market._totalRevenueUSD = ZERO_BD;

        // No maple rewards pools to begin with, they get added on MplRewards.sol->MplRewardsCreated
        market._mplRewardMplLp = null;
        market._mplRewardMplStake = null;
        market.save();
    }

    return market;
}

/**
 * Get the stake locker with stakeLockerAddress, or create it if it doesn't exist
 */
export function getOrCreateStakeLocker(event: ethereum.Event, stakeLockerAddress: Address): _StakeLocker {
    let stakeLocker = _StakeLocker.load(stakeLockerAddress.toHexString());

    if (!stakeLocker) {
        stakeLocker = new _StakeLocker(stakeLockerAddress.toHexString());

        const stakeLockerContract = StakeLockerContract.bind(stakeLockerAddress);

        const marketAddress = readCallResult(
            stakeLockerContract.try_pool(),
            ZERO_ADDRESS,
            stakeLockerContract.try_pool.name
        );

        const stakeTokenAddress = readCallResult(
            stakeLockerContract.try_stakeAsset(),
            ZERO_ADDRESS,
            stakeLockerContract.try_stakeAsset.name
        );

        stakeLocker.market = marketAddress.toHexString();
        stakeLocker.stakeToken = stakeTokenAddress.toHexString();
        stakeLocker.stakeTokenBalance = ZERO_BI;
        stakeLocker.stakeTokenBalanceInPoolInputTokens = ZERO_BI;
        stakeLocker.stakeTokenPriceUSD = ZERO_BD;
        stakeLocker.cumulativeStakeDefault = ZERO_BI;
        stakeLocker.cumulativeStakeDefaultInPoolInputTokens = ZERO_BI;
        stakeLocker.revenueInPoolInputTokens = ZERO_BI;
        stakeLocker.revenueUSD = ZERO_BD;
        stakeLocker.creationBlock = event.block.number;
        stakeLocker.lastUpdatedBlockNumber = event.block.number;

        stakeLocker.save();
    }

    return stakeLocker;
}

/**
 * Get the loan at loanAddress, or create it if is doesn't already exist.
 * Only loanAddress is required for get, everything should be set for create
 */
export function getOrCreateLoan(
    event: ethereum.Event,
    loanAddress: Address,
    marketAddress: Address = ZERO_ADDRESS,
    amountFunded: BigInt = ZERO_BI
): _Loan {
    let loan = _Loan.load(loanAddress.toHexString());

    if (!loan) {
        loan = new _Loan(loanAddress.toHexString());

        const loanV1Contract = LoanV1Contract.bind(loanAddress);

        // Loan versions have different function names and values
        //          V1                          V2/V3
        // --------------------------|----------------------------
        // apr                       |  interestRate
        // termDays                  |       -
        // paymentIntervalSeconds    |  paymentInterval

        const tryTermDays = loanV1Contract.try_termDays();

        if (!tryTermDays.reverted) {
            // V1
            loan.version = LoanVersion.V1;
            loan.termDays = tryTermDays.value;
            const rateFromContract = readCallResult(loanV1Contract.try_apr(), ZERO_BI, loanV1Contract.try_apr.name);
            loan.interestRate = rateFromContract.toBigDecimal().div(BigDecimal.fromString("100"));
        } else {
            // V2 or V3
            loan.version = LoanVersion.V2_OR_V3;
            const loanV2OrV3Contract = LoanV2OrV3Contract.bind(loanAddress);

            const paymentIntervalSec = readCallResult(
                loanV2OrV3Contract.try_paymentInterval(),
                ZERO_BI,
                loanV2OrV3Contract.try_paymentInterval.name
            );

            const paymentsRemaining = readCallResult(
                loanV2OrV3Contract.try_paymentsRemaining(),
                ZERO_BI,
                loanV2OrV3Contract.try_paymentsRemaining.name
            );

            loan.termDays = bigDecimalToBigInt(
                paymentIntervalSec
                    .times(paymentsRemaining)
                    .toBigDecimal()
                    .div(SEC_PER_DAY.toBigDecimal())
            );

            // Interst rate for V2/V3 stored as apr in units of 1e18, (i.e. 1% is 0.01e18).
            const rateFromContract = readCallResult(
                loanV2OrV3Contract.try_interestRate(),
                ZERO_BI,
                loanV2OrV3Contract.try_interestRate.name
            );

            loan.interestRate = parseUnits(rateFromContract, 18);
        }

        loan.market = marketAddress.toHexString();
        loan.amountFunded = amountFunded;

        loan.drawnDown = ZERO_BI;
        loan.principalPaid = ZERO_BI;
        loan.interestPaid = ZERO_BI;
        loan.collateralLiquidatedInPoolInputTokens = ZERO_BI;
        loan.defaultSuffered = ZERO_BI;
        loan.creationBlockNumber = event.block.number;

        loan.save();

        if (ZERO_ADDRESS == marketAddress || ZERO_BI == amountFunded) {
            log.error("Created loan with invalid params: marketAddress={}, amountFunded={}", [
                marketAddress.toHexString(),
                amountFunded.toString()
            ]);
        }
    }

    return loan;
}

/**
 * Get the mpl rewards at mplRewardAddress, or create it if it doesn't exist
 * On creation this will also connect it to the market and add a new rewards token (if applicable)
 */
export function getOrCreateMplReward(event: ethereum.Event, mplRewardAddress: Address): _MplReward {
    let mplReward = _MplReward.load(mplRewardAddress.toHexString());

    if (!mplReward) {
        mplReward = new _MplReward(mplRewardAddress.toHexString());

        const mplRewardContract = MplRewardContract.bind(mplRewardAddress);

        const stakeTokenAddress = readCallResult(
            mplRewardContract.try_stakingToken(),
            ZERO_ADDRESS,
            mplRewardContract.try_stakingToken.name
        );

        const rewardTokenAddress = readCallResult(
            mplRewardContract.try_rewardsToken(),
            ZERO_ADDRESS,
            mplRewardContract.try_rewardsToken.name
        );

        const rewardToken = getOrCreateRewardToken(rewardTokenAddress);
        const stakeToken = getOrCreateToken(stakeTokenAddress);

        // Explicity load market, we need to see if it exists
        let market = Market.load(stakeTokenAddress.toHexString());

        if (market) {
            // MPL-LP
            market._mplRewardMplLp = mplReward.id;
        } else {
            // MPL-STAKE
            const stakeLocker = getOrCreateStakeLocker(event, stakeTokenAddress);
            market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));
            market._mplRewardMplStake = mplReward.id;
        }

        // Add reward token to market if it doesn't exist
        let newRewardTokenForMarket = true;
        for (let i = 0; i < market.rewardTokens.length; i++) {
            if (market.rewardTokens[i] == rewardToken.id) {
                newRewardTokenForMarket = false;
            }
        }

        if (newRewardTokenForMarket) {
            const newRewardTokens = market.rewardTokens;
            newRewardTokens.push(rewardToken.id);
            market.rewardTokens = newRewardTokens;
        }

        mplReward.market = market.id;
        mplReward.stakeToken = stakeToken.id;
        mplReward.rewardToken = rewardToken.id;
        mplReward.rewardRatePerSecond = ZERO_BI;
        mplReward.rewardDurationSec = MPL_REWARDS_DEFAULT_DURATION_TIME_S;
        mplReward.periodFinishedTimestamp = ZERO_BI;
        mplReward.rewardTokenEmissionAmountPerDay = ZERO_BI;
        mplReward.rewardTokenEmissionsUSDPerDay = ZERO_BD;
        mplReward.creationBlockNumber = event.block.number;
        mplReward.lastUpdatedBlockNumber = event.block.number;

        market.save();
        mplReward.save();
    }

    return mplReward;
}
