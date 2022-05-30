import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
    Borrow,
    Deposit,
    Liquidate,
    Market,
    Repay,
    Token,
    Withdraw,
    _Loan,
    _Stake,
    _StakeLocker,
    _Unstake
} from "../../../generated/schema";
import { PROTOCOL_ID } from "../constants";

import { getOrCreateMarket, marketTick } from "./market";

export function createDeposit(event: ethereum.Event, market: Market, amountMPTMinted: BigInt): Deposit {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const deposit = new Deposit(id);

    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.protocol = PROTOCOL_ID;
    deposit.to = market.id;
    deposit.from = event.transaction.from.toHexString();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.market = market.id;
    deposit.asset = market.inputToken;
    deposit._amountMPT = amountMPTMinted;
    deposit.amount = BigInt.fromString(
        deposit._amountMPT
            .toBigDecimal()
            .times(market.exchangeRate)
            .toString()
    );
    deposit.amountUSD = deposit.amount.toBigDecimal().times(market.inputTokenPriceUSD);

    deposit.save();

    return deposit;
}

export function createWithdraw(event: ethereum.Event, market: Market, amountMPTBurned: BigInt): Withdraw {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const withdraw = new Withdraw(id);

    withdraw.hash = event.transaction.hash.toHexString();
    withdraw.logIndex = event.logIndex.toI32();
    withdraw.protocol = PROTOCOL_ID;
    withdraw.to = event.transaction.from.toHexString(); // from since its a burn
    withdraw.from = market.id;
    withdraw.blockNumber = event.block.number;
    withdraw.timestamp = event.block.timestamp;
    withdraw.market = market.id;
    withdraw.asset = market.inputToken;
    withdraw._amountMPT = amountMPTBurned;
    withdraw.amount = BigInt.fromString(
        withdraw._amountMPT
            .toBigDecimal()
            .times(market.exchangeRate)
            .toString()
    );
    withdraw.amountUSD = withdraw.amount.toBigDecimal().times(market.inputTokenPriceUSD);

    withdraw.save();

    return withdraw;
}

export function createBorrow(event: ethereum.Event, loan: _Loan, amount: BigInt): Borrow {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const borrow = new Borrow(id);
    const market = getOrCreateMarket(Address.fromString(loan.market));

    borrow.hash = event.transaction.hash.toHexString();
    borrow.logIndex = event.logIndex.toI32();
    borrow.protocol = PROTOCOL_ID;
    borrow.to = event.transaction.from.toHexString(); // They were the ones that triggered the drawdown
    borrow.from = loan.id;
    borrow.blockNumber = event.block.number;
    borrow.timestamp = event.block.timestamp;
    borrow.market = market.id;
    borrow.asset = market.inputToken;
    borrow.amount = amount;
    borrow.amountUSD = borrow.amount.toBigDecimal().times(market.inputTokenPriceUSD);

    borrow.save();

    return borrow;
}

export function createRepay(
    event: ethereum.Event,
    loan: _Loan,
    amount: BigInt,
    principalPaid: BigInt,
    interestPaid: BigInt,
    late: boolean
): Repay {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const repay = new Repay(id);
    const market = getOrCreateMarket(Address.fromString(loan.market));

    repay.hash = event.transaction.hash.toHexString();
    repay.logIndex = event.logIndex.toI32();
    repay.protocol = PROTOCOL_ID;
    repay.to = loan.id;
    repay.from = event.transaction.from.toHexString();
    repay.blockNumber = event.block.number;
    repay.timestamp = event.block.timestamp;
    repay.market = market.id;
    repay.asset = market.inputToken;
    repay.amount = amount;
    repay.amountUSD = repay.amount.toBigDecimal().times(market.inputTokenPriceUSD);
    repay._principalPaid = principalPaid;
    repay._interestPaid = interestPaid;
    repay._late = late;

    repay.save();

    return repay;
}

export function createLiquidate(
    event: ethereum.Event,
    loan: _Loan,
    amountRecoveredFromCollatoral: BigInt,
    defaultSufferedToPoolAndStake: BigInt,
    amountReturnedToBorrower: BigInt
): Liquidate {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const liquidate = new Liquidate(id);
    const market = getOrCreateMarket(Address.fromString(loan.market));

    liquidate.hash = event.transaction.hash.toHexString();
    liquidate.logIndex = event.logIndex.toI32();
    liquidate.protocol = PROTOCOL_ID;
    liquidate.to = market.id; // Funds sent to pool (after swapping)
    liquidate.from = loan.id; // Funds sent from loan
    liquidate.blockNumber = event.block.number;
    liquidate.timestamp = event.block.timestamp;
    liquidate.market = market.id;
    liquidate.asset = market.inputToken;
    liquidate._amountRecoveredFromCollatoral = amountRecoveredFromCollatoral;
    liquidate._defaultSufferedToPoolAndStake = defaultSufferedToPoolAndStake;
    liquidate._amountReturnedToBorrower = amountReturnedToBorrower;

    liquidate.amount = liquidate._amountRecoveredFromCollatoral.plus(liquidate._defaultSufferedToPoolAndStake);
    liquidate.amountUSD = liquidate.amount.toBigDecimal().times(market.inputTokenPriceUSD);

    liquidate.save();

    return liquidate;
}

export function createStake(
    event: ethereum.Event,
    market: Market,
    stakeToken: Token,
    amount: BigInt,
    type: string
): _Stake {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const stake = new _Stake(id);

    stake.hash = event.transaction.hash.toHexString();
    stake.logIndex = event.logIndex.toI32();
    stake.protocol = PROTOCOL_ID;
    stake.to = event.address.toHexString(); // to whatever emitted this event (stakeLocker or mplReward)
    stake.from = event.transaction.from.toHexString();
    stake.blockNumber = event.block.number;
    stake.timestamp = event.block.timestamp;
    stake.market = market.id;
    stake.asset = stakeToken.id;
    stake.amount = amount;
    stake.amountUSD = stake.amount.toBigDecimal().times(market.inputTokenPriceUSD);
    stake.stakeType = type;

    stake.save();

    return stake;
}

export function createUnstake(
    event: ethereum.Event,
    market: Market,
    stakeToken: Token,
    amount: BigInt,
    type: string
): _Unstake {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const unstake = new _Unstake(id);

    unstake.hash = event.transaction.hash.toHexString();
    unstake.logIndex = event.logIndex.toI32();
    unstake.protocol = PROTOCOL_ID;
    unstake.to = event.transaction.from.toHexString();
    unstake.from = event.address.toHexString(); // from whatever emitted this event (stakeLocker or mplReward)
    unstake.blockNumber = event.block.number;
    unstake.timestamp = event.block.timestamp;
    unstake.market = market.id;
    unstake.asset = stakeToken.id;
    unstake.amount = amount;
    unstake.amountUSD = unstake.amount.toBigDecimal().times(market.inputTokenPriceUSD);
    unstake.stakeType = type;

    unstake.save();

    return unstake;
}
