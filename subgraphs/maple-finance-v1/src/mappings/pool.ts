import { Address, log } from "@graphprotocol/graph-ts";

import {
    LoanV1 as LoanV1Template,
    LoanV2 as LoanV2Template,
    LoanV3 as LoanV3Template,
} from "../../generated/templates";
import {
    PoolStateChanged as PoolStateChangedEvent,
    LoanFunded as LoanFundedEvent,
    Transfer as TransferEvent,
    Claim as ClaimEvent,
    DefaultSuffered as DefaultSufferedEvent,
    FundsWithdrawn as FundsWithdrawnEvent,
} from "../../generated/templates/Pool/Pool";

import { LoanVersion, PoolState } from "../common/constants";
import {
    getOrCreateFinancialsDailySnapshot,
    getOrCreateMarketHourlySnapshot,
} from "../common/mappingHelpers/getOrCreate/snapshots";
import { getOrCreateMarketDailySnapshot } from "../common/mappingHelpers/getOrCreate/snapshots";
import {
    getOrCreateAccountMarket,
    getOrCreateLoan,
    getOrCreateMarket,
    getOrCreateStakeLocker,
} from "../common/mappingHelpers/getOrCreate/markets";
import {
    createClaim,
    createDeposit,
    createLiquidate,
    createWithdraw,
} from "../common/mappingHelpers/getOrCreate/transactions";
import { intervalUpdate } from "../common/mappingHelpers/update/intervalUpdate";
import { getTokenAmountInUSD } from "../common/prices/prices";
import { getOrCreateToken } from "../common/mappingHelpers/getOrCreate/supporting";
import { getOrCreateProtocol } from "../common/mappingHelpers/getOrCreate/protocol";

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
        market.cumulativeDepositUSD = market.cumulativeDepositUSD.plus(deposit.amountUSD);
        market.save();

        ////
        // Update protocol
        ////
        const protocol = getOrCreateProtocol();
        protocol.cumulativeDepositUSD = protocol.cumulativeDepositUSD.plus(deposit.amountUSD);
        protocol.save();

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
        const withdraw = createWithdraw(event, market, event.params.value, accountMarket.recognizedLosses);

        ////
        // Update AccountMarket
        ////
        accountMarket.recognizedLosses = accountMarket.recognizedLosses.plus(withdraw._losses);
        accountMarket.save();

        ////
        // Update market
        ////
        market._cumulativeWithdraw = market._cumulativeWithdraw.plus(withdraw.amount);
        market._recognizedPoolLosses = market._recognizedPoolLosses.plus(withdraw._losses);
        market.save();

        ////
        // Update financial snapshot
        ////
        const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
        financialsDailySnapshot.dailyWithdrawUSD = financialsDailySnapshot.dailyWithdrawUSD.plus(withdraw.amountUSD);
        financialsDailySnapshot.save();

        ////
        // Update market snapshot
        ////
        const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market);
        marketDailySnapshot.dailyWithdrawUSD = marketDailySnapshot.dailyWithdrawUSD.plus(withdraw.amountUSD);
        marketDailySnapshot.save();

        const MarketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
        MarketHourlySnapshot.hourlyWithdrawUSD = MarketHourlySnapshot.hourlyWithdrawUSD.plus(withdraw.amountUSD);
        MarketHourlySnapshot.save();

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
    } else if (LoanVersion.V2 == loan.version) {
        LoanV2Template.create(loanAddress);
    } else if (LoanVersion.V3 == loan.version) {
        LoanV3Template.create(loanAddress);
    } else {
        log.warning("Loan version not supported: ", [loan.version]);
    }

    ////
    // Update market
    ////
    market._cumulativeBorrow = market._cumulativeBorrow.plus(amountFunded);
    const fundedAmountUSD = getTokenAmountInUSD(event, inputToken, amountFunded);
    market.cumulativeBorrowUSD = market.cumulativeBorrowUSD.plus(fundedAmountUSD);
    market.save();

    ////
    // Update protocol
    ////
    const protocol = getOrCreateProtocol();
    protocol.cumulativeBorrowUSD = protocol.cumulativeBorrowUSD.plus(fundedAmountUSD);
    protocol.save();

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
    const poolInterestAmount = event.params.interest;
    const poolDelegateInterestAmount = event.params.poolDelegatePortion;
    const stakeLockerInterestAmount = event.params.stakeLockerPortion;
    const principalRepayAmount = event.params.principal;

    const principalRepayAmountUSD = getTokenAmountInUSD(event, inputToken, principalRepayAmount);
    const totalInterestAmountUSD = getTokenAmountInUSD(
        event,
        inputToken,
        poolInterestAmount.plus(poolDelegateInterestAmount).plus(stakeLockerInterestAmount)
    );

    ////
    // Update stake locker
    ////
    const stakeLocker = getOrCreateStakeLocker(event, Address.fromString(market._stakeLocker));
    stakeLocker.cumulativeInterestInPoolInputTokens =
        stakeLocker.cumulativeInterestInPoolInputTokens.plus(poolDelegateInterestAmount);
    stakeLocker.save();

    ////
    // Update market
    ////
    market._cumulativePrincipalRepay = market._cumulativePrincipalRepay.plus(principalRepayAmount);
    market._cumulativeInterest = market._cumulativeInterest.plus(poolInterestAmount);
    market._cumulativePoolDelegateRevenue = market._cumulativePoolDelegateRevenue.plus(poolDelegateInterestAmount);
    market.cumulativeSupplySideRevenueUSD = market.cumulativeSupplySideRevenueUSD.plus(totalInterestAmountUSD);
    market.save();

    ////
    // Update protocol
    ////
    const protocol = getOrCreateProtocol();
    protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(totalInterestAmountUSD);
    protocol.save();

    ////
    // Update financial snapshot
    ////
    const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
    financialsDailySnapshot.dailySupplySideRevenueUSD =
        financialsDailySnapshot.dailySupplySideRevenueUSD.plus(totalInterestAmountUSD);
    financialsDailySnapshot.save();

    ////
    // Update market snapshot
    ////
    const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market);
    marketDailySnapshot.dailySupplySideRevenueUSD =
        marketDailySnapshot.dailySupplySideRevenueUSD.plus(totalInterestAmountUSD);
    marketDailySnapshot.dailyRepayUSD = marketDailySnapshot.dailyRepayUSD.plus(
        principalRepayAmountUSD.plus(totalInterestAmountUSD)
    );
    marketDailySnapshot.save();

    const marketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
    marketHourlySnapshot.hourlySupplySideRevenueUSD =
        marketHourlySnapshot.hourlySupplySideRevenueUSD.plus(totalInterestAmountUSD);
    marketHourlySnapshot.hourlyRepayUSD = marketHourlySnapshot.hourlyRepayUSD.plus(
        principalRepayAmountUSD.plus(totalInterestAmountUSD)
    );
    marketHourlySnapshot.save();

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
    const stakeAssetBurnedAmount = event.params.bptsBurned;
    const stakeLocker = getOrCreateStakeLocker(event, Address.fromString(market._stakeLocker));
    stakeLocker.cumulativeLosses = stakeLocker.cumulativeLosses.plus(stakeAssetBurnedAmount);
    stakeLocker.cumulativeLossesInPoolInputToken = stakeLocker.cumulativeLossesInPoolInputToken.plus(
        liquidate._defaultSufferedByStakeLocker
    );
    stakeLocker.save();

    ////
    // Update market
    ////
    market._cumulativePoolLosses = market._cumulativePoolLosses.plus(liquidate._defaultSufferedByPool);
    market.cumulativeLiquidateUSD = market.cumulativeLiquidateUSD.plus(liquidate.amountUSD);
    market.save();

    ////
    // Update market snapshot
    ////
    const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market);
    marketDailySnapshot.dailyLiquidateUSD = marketDailySnapshot.dailyLiquidateUSD.plus(liquidate.amountUSD);
    marketDailySnapshot.save();

    const MarketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
    MarketHourlySnapshot.hourlyLiquidateUSD = MarketHourlySnapshot.hourlyLiquidateUSD.plus(liquidate.amountUSD);
    MarketHourlySnapshot.save();

    ////
    // Update protocol
    ////
    const protocol = getOrCreateProtocol();
    protocol.cumulativeLiquidateUSD = protocol.cumulativeLiquidateUSD.plus(liquidate.amountUSD);
    protocol.save();

    ////
    // Update protocol snapshot
    ////
    const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
    financialsDailySnapshot.dailyLiquidateUSD = financialsDailySnapshot.dailyBorrowUSD.plus(liquidate.amountUSD);
    financialsDailySnapshot.save();

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
