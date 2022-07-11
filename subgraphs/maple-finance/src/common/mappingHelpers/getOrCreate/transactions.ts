import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

import {
    Borrow,
    Deposit,
    Liquidate,
    Market,
    Repay,
    Token,
    Withdraw,
    _Claim,
    _Loan,
    _Stake,
    _Unstake
} from "../../../../generated/schema";
import { Pool as PoolContract } from "../../../../generated/templates/Pool/Pool";

import { PROTOCOL_ID, StakeType, TransactionType, ZERO_BD, ZERO_BI } from "../../constants";
import { getTokenAmountInUSD } from "../../prices/prices";
import { bigDecimalToBigInt, minBigInt, readCallResult } from "../../utils";
import { updateUsageMetrics } from "../update/usage";
import { getOrCreateMarket } from "./markets";
import { getOrCreateToken } from "./supporting";

/**
 * Create deposit entity for deposit into the market
 * @param market market depositing into
 * @param amountMPTMinted amount of LP tokens that were minted on the deposit
 * @returns deposit entity
 */
export function createDeposit(event: ethereum.Event, market: Market, amountMPTMinted: BigInt): Deposit {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const deposit = new Deposit(id);

    const asset = getOrCreateToken(Address.fromString(market.inputToken));
    const accountAddress = event.transaction.from;

    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.protocol = PROTOCOL_ID;
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;

    deposit.market = market.id;
    deposit.asset = asset.id;
    deposit.from = accountAddress.toHexString();
    deposit.to = market._liquidityLockerAddress;
    deposit._amountMPT = amountMPTMinted;
    deposit.amount = bigDecimalToBigInt(deposit._amountMPT.toBigDecimal().times(market._initialExchangeRate));
    deposit.amountUSD = getTokenAmountInUSD(event, asset, deposit.amount);

    deposit.save();

    updateUsageMetrics(event, accountAddress, TransactionType.DEPOSIT);

    return deposit;
}

/**
 * Create withdraw entity for withdrawing principal out of the market, this also includes recognizing unrecognized pool losses
 * @param market market withdrawing out of into
 * @param amountMPTMinted amount of LP tokens that were burned on the withdraw
 * @param oldRecognizedLosses amount of recognized losses for the account before this withdraw
 * @returns withdraw entity
 */
export function createWithdraw(
    event: ethereum.Event,
    market: Market,
    amountMPTBurned: BigInt,
    oldRecognizedLosses: BigInt
): Withdraw {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const withdraw = new Withdraw(id);

    const asset = getOrCreateToken(Address.fromString(market.inputToken));
    const accountAddress = event.transaction.from;

    const poolContract = PoolContract.bind(Address.fromString(market.id));
    const newRecognizedLosses = readCallResult(
        poolContract.try_recognizedLossesOf(accountAddress),
        ZERO_BI,
        poolContract.recognizedLossesOf.name
    );
    const losses = newRecognizedLosses.minus(oldRecognizedLosses);

    const losslessAmount = bigDecimalToBigInt(amountMPTBurned.toBigDecimal().times(market._initialExchangeRate));

    withdraw.hash = event.transaction.hash.toHexString();
    withdraw.logIndex = event.logIndex.toI32();
    withdraw.protocol = PROTOCOL_ID;
    withdraw.blockNumber = event.block.number;
    withdraw.timestamp = event.block.timestamp;

    withdraw.market = market.id;
    withdraw.asset = asset.id;
    withdraw.from = market._liquidityLockerAddress;
    withdraw.to = accountAddress.toHexString(); // from since its a burn
    withdraw._amountMPT = amountMPTBurned;
    withdraw._losses = losses;
    withdraw.amount = losslessAmount.minus(withdraw._losses);
    withdraw.amountUSD = getTokenAmountInUSD(event, asset, withdraw.amount);

    withdraw.save();

    updateUsageMetrics(event, accountAddress, TransactionType.WITHDRAW);

    return withdraw;
}

/**
 * Create claim entity for claiming interest from a market
 * @param market market claiming interest from
 * @param amount amount of interest in market input tokens being claimed
 * @returns claim entity
 */
export function createClaim(event: ethereum.Event, market: Market, amount: BigInt): _Claim {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const claim = new _Claim(id);

    const asset = getOrCreateToken(Address.fromString(market.inputToken));
    const account = event.transaction.from;

    claim.hash = event.transaction.hash.toHexString();
    claim.logIndex = event.logIndex.toI32();
    claim.protocol = PROTOCOL_ID;
    claim.blockNumber = event.block.number;
    claim.timestamp = event.block.timestamp;

    claim.market = market.id;
    claim.asset = market.inputToken;
    claim.from = market._liquidityLockerAddress;
    claim.to = account.toHexString();
    claim.amount = amount;
    claim.amountUSD = getTokenAmountInUSD(event, asset, claim.amount);

    claim.save();

    updateUsageMetrics(event, account, TransactionType.CLAIM);

    return claim;
}

/**
 * Create borrow entity for borrowing from a loan
 * @param loan loan that is being borrowed from
 * @param amount amount being borrowed in pool input tokens
 * @param treasuryFeePaid amount being sent to treasury for establishment fee
 * @returns borrow entity
 */
export function createBorrow(event: ethereum.Event, loan: _Loan, amount: BigInt, treasuryFeePaid: BigInt): Borrow {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const borrow = new Borrow(id);

    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    const asset = getOrCreateToken(Address.fromString(market.inputToken));
    const accountAddress = event.transaction.from;

    borrow.hash = event.transaction.hash.toHexString();
    borrow.logIndex = event.logIndex.toI32();
    borrow.protocol = PROTOCOL_ID;
    borrow.blockNumber = event.block.number;
    borrow.timestamp = event.block.timestamp;

    borrow._loan = loan.id;
    borrow.market = market.id;
    borrow.asset = market.inputToken;
    borrow.from = loan.id;
    borrow.to = accountAddress.toHexString(); // They were the ones that triggered the drawdown
    borrow.amount = amount;
    borrow.amountUSD = getTokenAmountInUSD(event, asset, borrow.amount);
    borrow._treasuryFeePaid = treasuryFeePaid;
    borrow._treasuryFeePaidUSD = getTokenAmountInUSD(event, asset, treasuryFeePaid);

    borrow.save();

    updateUsageMetrics(event, accountAddress, TransactionType.BORROW);

    return borrow;
}

/**
 * Create repay entity for making a payment on a loan
 * @param loan loan to repayment is to
 * @param principalPaid princiapal repaid
 * @param interestPaid interest repaid, this includes both pool delegate and pool interest
 * @param treasuryFeePaid treasury fee paid (V3 only)
 * @returns repay entity
 */
export function createRepay(
    event: ethereum.Event,
    loan: _Loan,
    principalPaid: BigInt,
    interestPaid: BigInt,
    treasuryFeePaid: BigInt
): Repay {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const repay = new Repay(id);

    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    const asset = getOrCreateToken(Address.fromString(market.inputToken));
    const accountAddress = event.transaction.from;

    repay.hash = event.transaction.hash.toHexString();
    repay.logIndex = event.logIndex.toI32();
    repay.protocol = PROTOCOL_ID;
    repay.blockNumber = event.block.number;
    repay.timestamp = event.block.timestamp;

    repay._loan = loan.id;
    repay.market = market.id;
    repay.asset = asset.id;
    repay.from = accountAddress.toHexString();
    repay.to = loan.id;
    repay._principalPaid = principalPaid;
    repay._interestPaid = interestPaid;
    repay._treasuryFeePaid = treasuryFeePaid;
    repay._treasuryFeePaidUSD = getTokenAmountInUSD(event, asset, treasuryFeePaid);
    repay.amount = principalPaid.plus(interestPaid).plus(treasuryFeePaid);
    repay.amountUSD = getTokenAmountInUSD(event, asset, repay.amount);

    repay.save();

    updateUsageMetrics(event, accountAddress, TransactionType.REPAY);

    return repay;
}

/**
 * Create liquidated entity for liquidation of a loan hitting.
 * Liquidation is considered portion hitting the stake locker and pool
 * @param loan loan that defaulted
 * @param defaultSufferedByStakeLocker default suffered by the stake locker
 * @param defaultsufferedByPool default suffered by the pool
 * @returns liquidation entity
 */
export function createLiquidate(
    event: ethereum.Event,
    loan: _Loan,
    defaultSufferedByStakeLocker: BigInt,
    defaultsufferedByPool: BigInt
): Liquidate {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const liquidate = new Liquidate(id);

    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    const asset = getOrCreateToken(Address.fromString(market.inputToken));
    const accountAddress = event.transaction.from;

    liquidate.hash = event.transaction.hash.toHexString();
    liquidate.logIndex = event.logIndex.toI32();
    liquidate.protocol = PROTOCOL_ID;
    liquidate.blockNumber = event.block.number;
    liquidate.timestamp = event.block.timestamp;

    liquidate.market = market.id;
    liquidate.asset = market.inputToken;
    liquidate.from = market._stakeLocker;
    liquidate.to = market._liquidityLockerAddress;
    liquidate._defaultSufferedByStakeLocker = defaultSufferedByStakeLocker;
    liquidate._defaultSufferedByPool = defaultsufferedByPool;
    liquidate.amount = liquidate._defaultSufferedByStakeLocker.plus(liquidate._defaultSufferedByPool);
    liquidate.amountUSD = getTokenAmountInUSD(event, asset, liquidate.amount);
    liquidate.profitUSD = ZERO_BD;

    liquidate.save();

    updateUsageMetrics(event, accountAddress, TransactionType.LIQUIDATE);

    return liquidate;
}

/**
 * Create stake entity for staking to stake locker, or mpl rewards
 * @param market market the stake belongs to
 * @param stakeToken token being staked
 * @param amount amount being staked
 * @param type type of stake
 * @returns stake entity
 */
export function createStake(
    event: ethereum.Event,
    market: Market,
    stakeToken: Token,
    amount: BigInt,
    type: string
): _Stake {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const stake = new _Stake(id);

    const accountAddress = event.transaction.from;

    stake.hash = event.transaction.hash.toHexString();
    stake.logIndex = event.logIndex.toI32();
    stake.protocol = PROTOCOL_ID;
    stake.blockNumber = event.block.number;
    stake.timestamp = event.block.timestamp;

    stake.market = market.id;
    stake.asset = stakeToken.id;
    stake.from = accountAddress.toHexString();
    stake.to = event.address.toHexString(); // to whatever emitted this event (stakeLocker or mplReward)
    stake.amount = amount;

    stake.stakeType = type;

    stake.save();

    updateUsageMetrics(event, accountAddress, TransactionType.STAKE);

    return stake;
}

/**
 * Create unstake entity for unstaking to stake locker, or mpl rewards
 * @param market market the stake belongs to
 * @param stakeToken token being unstaked
 * @param amount amount being unstaked
 * @param type type of unstake
 * @returns unstake entity
 */
export function createUnstake(
    event: ethereum.Event,
    market: Market,
    stakeToken: Token,
    amount: BigInt,
    type: string
): _Unstake {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const unstake = new _Unstake(id);

    const accountAddress = event.transaction.from;

    unstake.hash = event.transaction.hash.toHexString();
    unstake.logIndex = event.logIndex.toI32();
    unstake.protocol = PROTOCOL_ID;
    unstake.blockNumber = event.block.number;
    unstake.timestamp = event.block.timestamp;

    unstake.market = market.id;
    unstake.asset = stakeToken.id;
    unstake.from = event.address.toHexString(); // from whatever emitted this event (stakeLocker or mplReward)
    unstake.to = accountAddress.toHexString();
    unstake.amount = amount;
    unstake.stakeType = type;

    unstake.save();

    updateUsageMetrics(event, accountAddress, TransactionType.UNSTAKE);

    return unstake;
}
