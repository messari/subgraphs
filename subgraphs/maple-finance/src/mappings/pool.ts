import { Address, log } from "@graphprotocol/graph-ts";

import { LoanV1 as LoanV1Template, LoanV2OrV3 as LoanV2OrV3Template } from "../../generated/templates";
import {
    PoolStateChanged as PoolStateChangedEvent,
    LoanFunded as LoanFundedEvent,
    Transfer as TransferEvent,
    Claim as ClaimEvent,
    DefaultSuffered as DefaultSufferedEvent,
    FundsWithdrawn as FundsWithdrawnEvent,
    LossesRecognized as LossesRecognizedEvent
} from "../../generated/templates/Pool/Pool";

import { LoanVersion, PoolState } from "../common/constants";
import {
    getOrCreateFinancialsDailySnapshot,
    getOrCreateMarketHourlySnapshot
} from "../common/mappingHelpers/getOrCreate/snapshots";
import { getOrCreateMarketDailySnapshot } from "../common/mappingHelpers/getOrCreate/snapshots";
import {
    getOrCreateAccountMarket,
    getOrCreateLoan,
    getOrCreateMarket,
    getOrCreateStakeLocker
} from "../common/mappingHelpers/getOrCreate/markets";
import {
    createClaim,
    createDeposit,
    createLiquidate,
    createWithdraw
} from "../common/mappingHelpers/getOrCreate/transactions";
import { intervalUpdate } from "../common/mappingHelpers/update/intervalUpdate";
import { getTokenAmountInUSD, getTokenPriceInUSD } from "../common/prices/prices";
import { getOrCreateToken } from "../common/mappingHelpers/getOrCreate/supporting";

export function handleLossesRecognized(event: LossesRecognizedEvent): void {
    const market = getOrCreateMarket(event, event.address);
    const accountAddress = event.transaction.from;
    const accountMarket = getOrCreateAccountMarket(event, accountAddress, market);

    accountMarket.unrecognizedLosses = accountMarket.unrecognizedLosses.plus(event.params.lossesRecognized);
    accountMarket.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handleTransfer(event: TransferEvent): void {
    if (Address.zero() == event.params.from) {
        // Deposit (mint)
        const marketAddress = event.address;
        const market = getOrCreateMarket(event, marketAddress);

        ////
        // Create deposit
        ////
        const deposit = createDeposit(event, market, event.params.value);

        ////
        // Update market
        ////
        market._cumulativeDeposit = market._cumulativeDeposit.plus(deposit.amount);
        market.save();

        ////
        // Update market snapshot
        ////
        const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market);
        marketDailySnapshot.dailyDepositUSD = marketDailySnapshot.dailyDepositUSD.plus(deposit.amountUSD);
        marketDailySnapshot.save();

        const MarketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
        MarketHourlySnapshot.hourlyDepositUSD = MarketHourlySnapshot.hourlyDepositUSD.plus(deposit.amountUSD);
        MarketHourlySnapshot.save();

        ////
        // Update financial snapshot
        ////
        const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
        financialsDailySnapshot.dailyDepositUSD = financialsDailySnapshot.dailyDepositUSD.plus(deposit.amountUSD);
        financialsDailySnapshot.save();

        ////
        // Trigger interval update
        ////
        intervalUpdate(event, market);
    } else if (Address.zero() == event.params.to) {
        // Withdraw (burn)
        const marketAddress = event.address;
        const market = getOrCreateMarket(event, marketAddress);
        const accountAddress = event.transaction.from;
        const accountMarket = getOrCreateAccountMarket(event, accountAddress, market);

        ////
        // Create withdraw
        ////
        const withdraw = createWithdraw(event, market, event.params.value, accountMarket.unrecognizedLosses);

        ////
        // Update AccountMarket
        ////
        accountMarket.recognizedLosses = accountMarket.recognizedLosses.plus(withdraw._losses);
        accountMarket.unrecognizedLosses = accountMarket.unrecognizedLosses.minus(withdraw._losses);
        accountMarket.save();

        ////
        // Update market
        ////
        market._cumulativeWithdraw = market._cumulativeWithdraw.plus(withdraw.amount);
        market.save();

        ////
        // Trigger interval update
        ////
        intervalUpdate(event, market);
    }
}

export function handlePoolStateChanged(event: PoolStateChangedEvent): void {
    const market = getOrCreateMarket(event, event.address);

    ////
    // Update market
    ////
    const active = event.params.state == PoolState.Finalized;
    market.isActive = active;
    market.canBorrowFrom = active;
    market.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handleLoanFunded(event: LoanFundedEvent): void {
    const loanAddress = event.params.loan;
    const loan = getOrCreateLoan(event, loanAddress, event.address);
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    const inputToken = getOrCreateToken(Address.fromString(market.inputToken));
    const amountFunded = event.params.amountFunded;

    ////
    // Create loan entity
    ////
    loan.amountFunded = loan.amountFunded.plus(amountFunded);
    loan.save();

    ////
    // Create loan template
    ////
    if (LoanVersion.V1 == loan.version) {
        LoanV1Template.create(loanAddress);
    } else {
        LoanV2OrV3Template.create(loanAddress);
    }

    ////
    // Update market
    ////
    market._cumulativeBorrow = market._cumulativeBorrow.plus(amountFunded);
    market.save();

    ////
    // Update market snapshot
    ////
    const amountFundedUSD = getTokenAmountInUSD(event, inputToken, amountFunded);
    const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market);
    marketDailySnapshot.dailyBorrowUSD = marketDailySnapshot.dailyBorrowUSD.plus(amountFundedUSD);
    marketDailySnapshot.save();

    const MarketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
    MarketHourlySnapshot.hourlyBorrowUSD = MarketHourlySnapshot.hourlyBorrowUSD.plus(amountFundedUSD);
    MarketHourlySnapshot.save();

    ////
    // Update financial snapshot
    ////
    const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
    financialsDailySnapshot.dailyBorrowUSD = financialsDailySnapshot.dailyBorrowUSD.plus(amountFundedUSD);
    financialsDailySnapshot.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handleClaim(event: ClaimEvent): void {
    const market = getOrCreateMarket(event, event.address);
    const inputToken = getOrCreateToken(Address.fromString(market.inputToken));

    ////
    // Update stake locker
    ////
    const stakeLocker = getOrCreateStakeLocker(event, Address.fromString(market._stakeLocker));
    stakeLocker.cumulativeInterestInPoolInputTokens = stakeLocker.cumulativeInterestInPoolInputTokens.plus(
        event.params.stakeLockerPortion
    );
    stakeLocker.save();

    ////
    // Update market
    ////
    market._cumulativePrincipalRepay = market._cumulativePrincipalRepay.plus(event.params.principal);
    market._cumulativeInterest = market._cumulativeInterest.plus(event.params.interest);
    market._cumulativePoolDelegateRevenue = market._cumulativePoolDelegateRevenue.plus(
        event.params.poolDelegatePortion
    );
    market.save();

    ////
    // Update financial snapshot
    ////
    const supplySideRevenueUSD = getTokenAmountInUSD(
        event,
        inputToken,
        market._cumulativeInterest.plus(market._cumulativePoolDelegateRevenue)
    );
    const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
    financialsDailySnapshot.dailySupplySideRevenueUSD = financialsDailySnapshot.dailySupplySideRevenueUSD.plus(
        supplySideRevenueUSD
    );
    financialsDailySnapshot.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handleDefaultSuffered(event: DefaultSufferedEvent): void {
    const market = getOrCreateMarket(event, event.address);
    const loan = getOrCreateLoan(event, event.params.loan);

    ////
    // Create liquidate
    ////
    const defaultSufferedByStakeLocker = event.params.liquidityAssetRecoveredFromBurn;
    const defaultSufferedByPool = event.params.defaultSuffered.minus(defaultSufferedByStakeLocker);
    const liquidate = createLiquidate(event, loan, defaultSufferedByStakeLocker, defaultSufferedByPool);

    ////
    // Update loan
    ////
    loan.defaultSuffered = loan.defaultSuffered.plus(liquidate.amount);
    loan.save();

    ////
    // Update stake locker
    ////
    const stakeAssetBurnedAmount = event.params.bptsBurned.minus(event.params.bptsReturned);
    const stakeLocker = getOrCreateStakeLocker(event, Address.fromString(market._stakeLocker));
    stakeLocker.cumulativeLosses = stakeLocker.cumulativeLosses.plus(stakeAssetBurnedAmount);
    stakeLocker.cumulativeLossesInPoolInputToken = stakeLocker.cumulativeLosses.plus(
        liquidate._defaultSufferedByStakeLocker
    );
    stakeLocker.save();

    ////
    // Update market
    ////
    market._cumulativePoolLosses = market._cumulativePoolLosses.plus(liquidate._defaultSufferedByPool);
    market.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handleFundsWithdrawn(event: FundsWithdrawnEvent): void {
    const marketAddress = event.address;
    const market = getOrCreateMarket(event, marketAddress);

    ////
    // Create claim
    ////
    const claim = createClaim(event, market, event.params.fundsWithdrawn);

    ////
    // Update market
    ////
    market._cumulativeInterestClaimed = market._cumulativeInterestClaimed.plus(claim.amount);
    market.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}
