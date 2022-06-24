import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";

import { InterestRate, Market, _AccountMarket, _Loan, _MplReward, _StakeLocker } from "../../../../generated/schema";
import { LoanV1 as LoanV1Contract } from "../../../../generated/templates/LoanV1/LoanV1";
import { LoanV2 as LoanV2Contract } from "../../../../generated/templates/LoanV2/LoanV2";
import { Pool as PoolContract } from "../../../../generated/templates/Pool/Pool";
import { StakeLocker as StakeLockerContract } from "../../../../generated/templates/StakeLocker/StakeLocker";
import { MplReward as MplRewardContract } from "../../../../generated/templates/MplReward/MplReward";

import {
    LoanVersion,
    LOAN_V2_IMPLEMENTATION_ADDRESS,
    MPL_REWARDS_DEFAULT_DURATION_TIME_S,
    POOL_WAD_DECIMALS,
    PROTOCOL_ID,
    PROTOCOL_INTEREST_RATE_SIDE,
    PROTOCOL_INTEREST_RATE_TYPE,
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

        const liquidityLockerAddress = readCallResult(
            poolContract.try_liquidityLocker(),
            ZERO_ADDRESS,
            poolContract.try_liquidityLocker.name
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
        market._liquidityLockerAddress = liquidityLockerAddress.toHexString();

        // No maple rewards pools to begin with, they get added on MplRewards.sol->MplRewardsCreated
        market._mplRewardMplLp = null;
        market._mplRewardMplStake = null;

        market._cumulativeDeposit = ZERO_BI;
        market._cumulativeWithdraw = ZERO_BI;
        market._cumulativeBorrow = ZERO_BI;
        market._cumulativePrincipalRepay = ZERO_BI;
        market._cumulativeInterest = ZERO_BI;
        market._cumulativeInterestClaimed = ZERO_BI;
        market._cumulativePoolLosses = ZERO_BI;
        market._cumulativePoolDelegateRevenue = ZERO_BI;
        market._cumulativeTreasuryRevenue = ZERO_BI;
        market._totalDepositBalance = ZERO_BI;
        market._totalInterestBalance = ZERO_BI;
        market._totalBorrowBalance = ZERO_BI;
        market._cumulativeLiquidate = ZERO_BI;
        market._cumulativeSupplySideRevenueUSD = ZERO_BD;
        market._cumulativeProtocolSideRevenueUSD = ZERO_BD;
        market._cumulativeTotalRevenueUSD = ZERO_BD;
        market._lastUpdatedBlockNumber = event.block.number;

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
        stakeLocker.creationBlockNumber = event.block.number;

        stakeLocker.cumulativeStake = ZERO_BI;
        stakeLocker.cumulativeUnstake = ZERO_BI;
        stakeLocker.cumulativeLosses = ZERO_BI;
        stakeLocker.cumulativeLossesInPoolInputToken = ZERO_BI;
        stakeLocker.cumulativeInterestInPoolInputTokens = ZERO_BI;

        stakeLocker.stakeTokenBalance = ZERO_BI;
        stakeLocker.stakeTokenBalanceUSD = ZERO_BD;
        stakeLocker.stakeTokenSwapOutBalanceInPoolInputTokens = ZERO_BI;
        stakeLocker.lastUpdatedBlockNumber = event.block.number;

        stakeLocker.save();
    }

    return stakeLocker;
}

/**
 * Create an interest rate, this also adds it to the market that the loan belongs to.
 * @param loan loan this interest rate if for
 * @param rate rate in percentage APY (i.e 5.31% should be stored as 5.31)
 * @param durationDays number of days for the loan
 */
export function getOrCreateInterestRate(
    event: ethereum.Event,
    loan: _Loan,
    rate: BigDecimal = ZERO_BD,
    durationDays: BigInt = ZERO_BI
): InterestRate {
    const id = PROTOCOL_INTEREST_RATE_SIDE + "-" + PROTOCOL_INTEREST_RATE_TYPE + "-" + loan.id;
    let interestRate = InterestRate.load(id);

    if (!interestRate) {
        interestRate = new InterestRate(id);

        const market = getOrCreateMarket(event, Address.fromString(loan.market));

        interestRate.rate = rate;
        interestRate.duration = durationDays.toI32();
        interestRate.maturityBlock = null; // Doesn't apply here
        interestRate.side = PROTOCOL_INTEREST_RATE_SIDE;
        interestRate.type = PROTOCOL_INTEREST_RATE_TYPE;
        interestRate._loan = loan.id;
        interestRate._market = market.id;

        interestRate.save();

        if (ZERO_BD == rate || ZERO_BI == durationDays) {
            log.error("Created interest rate with invalid params: rate={}, durationDays={}", [
                rate.toString(),
                durationDays.toString()
            ]);
        }
    }

    return interestRate;
}

/**
 * Get the loan at loanAddress, or create it if is doesn't already exist.
 * Only loanAddress is required for get, everything should be set for create
 * On creation, interest rate is also added to the market
 */
export function getOrCreateLoan(
    event: ethereum.Event,
    loanAddress: Address,
    marketAddress: Address = ZERO_ADDRESS
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

        loan.market = marketAddress.toHexString();
        loan.creationBlockNumber = event.block.number;
        loan.amountFunded = ZERO_BI;
        loan.refinanceCount = ZERO_BI;
        loan.drawnDown = ZERO_BI;
        loan.principalPaid = ZERO_BI;
        loan.interestPaid = ZERO_BI;
        loan.defaultSuffered = ZERO_BI;
        loan.treasuryFeePaid = ZERO_BI;

        const tryTermDays = loanV1Contract.try_termDays();

        if (!tryTermDays.reverted) {
            // V1
            loan.version = LoanVersion.V1;
            const rateFromContract = readCallResult(loanV1Contract.try_apr(), ZERO_BI, loanV1Contract.try_apr.name);
            const rate = rateFromContract.toBigDecimal().div(BigDecimal.fromString("100"));
            const interestRate = getOrCreateInterestRate(event, loan, rate, tryTermDays.value);
            loan.interestRate = interestRate.id;
        } else {
            // V2 or V3, functions used below are common between
            const loanV2V3Contract = LoanV2Contract.bind(loanAddress);

            const implementationAddress = readCallResult(
                loanV2V3Contract.try_implementation(),
                ZERO_ADDRESS,
                loanV2V3Contract.try_implementation.name
            );

            if (LOAN_V2_IMPLEMENTATION_ADDRESS.equals(implementationAddress)) {
                loan.version = LoanVersion.V2;
            } else {
                loan.version = LoanVersion.V3;
            }

            const paymentIntervalSec = readCallResult(
                loanV2V3Contract.try_paymentInterval(),
                ZERO_BI,
                loanV2V3Contract.try_paymentInterval.name
            );

            const paymentsRemaining = readCallResult(
                loanV2V3Contract.try_paymentsRemaining(),
                ZERO_BI,
                loanV2V3Contract.try_paymentsRemaining.name
            );

            const termDays = bigDecimalToBigInt(
                paymentIntervalSec
                    .times(paymentsRemaining)
                    .toBigDecimal()
                    .div(SEC_PER_DAY.toBigDecimal())
            );

            // Interst rate for V2/V3 stored as apr in units of 1e18, (i.e. 1% is 0.01e18).
            const rateFromContract = readCallResult(
                loanV2V3Contract.try_interestRate(),
                ZERO_BI,
                loanV2V3Contract.try_interestRate.name
            );

            const rate = parseUnits(rateFromContract, 18).times(BigDecimal.fromString("100"));
            const interestRate = getOrCreateInterestRate(event, loan, rate, termDays);
            loan.interestRate = interestRate.id;
        }

        loan.save();

        // Add the interest rate to market to satisfy the std schema
        const market = getOrCreateMarket(event, marketAddress);
        const rates = market.rates;
        rates.push(loan.interestRate);
        market.rates = rates;
        market.save();

        if (ZERO_ADDRESS == marketAddress) {
            log.error("Created loan with invalid params: marketAddress={}", [marketAddress.toHexString()]);
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

        // Explicity load market, we need to see if it exists, if so MPL-LP
        let market = Market.load(stakeTokenAddress.toHexString());

        if (!market) {
            // MPL-STAKE
            const stakeLocker = getOrCreateStakeLocker(event, stakeTokenAddress);
            market = getOrCreateMarket(event, Address.fromString(stakeLocker.market));
        }

        mplReward.market = market.id;
        mplReward.stakeToken = stakeToken.id;
        mplReward.rewardToken = rewardToken.id;
        mplReward.creationBlockNumber = event.block.number;

        mplReward.rewardRatePerSecond = ZERO_BI;
        mplReward.rewardDurationSec = MPL_REWARDS_DEFAULT_DURATION_TIME_S;
        mplReward.periodFinishedTimestamp = ZERO_BI;

        mplReward.rewardTokenEmissionAmountPerDay = ZERO_BI;
        mplReward.lastUpdatedBlockNumber = event.block.number;

        mplReward.save();
    }

    return mplReward;
}

/**
 * Get the account at this address in this market, or create it if it doesn't exist.
 */
export function getOrCreateAccountMarket(
    event: ethereum.Event,
    accountAddress: Address,
    market: Market
): _AccountMarket {
    const id = accountAddress.toHexString() + "-" + market.id;
    let accountMarket = _AccountMarket.load(id);

    if (!accountMarket) {
        accountMarket = new _AccountMarket(id);

        accountMarket.market = market.id;
        accountMarket.unrecognizedLosses = ZERO_BI;
        accountMarket.recognizedLosses = ZERO_BI;

        accountMarket.creationBlockNumber = event.block.number;
        accountMarket.save();
    }

    return accountMarket;
}
