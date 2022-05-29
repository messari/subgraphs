import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Borrow, Deposit, Liquidate, Market, Repay, Withdraw } from "../../../generated/schema";
import { PROTOCOL_ID } from "../constants";

export function createDeposit(event: ethereum.Event, market: Market, amountMPTMinted: BigInt): Deposit {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const deposit = new Deposit(id);

    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.protocol = PROTOCOL_ID;
    deposit.to = market.id;
    deposit.from = event.transaction.from.toString();
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
    withdraw.to = event.transaction.from.toString(); // from since its a burn
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

export function createBorrow(event: ethereum.Event, market: Market, amount: BigInt): Borrow {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const borrow = new Borrow(id);

    borrow.hash = event.transaction.hash.toHexString();
    borrow.logIndex = event.logIndex.toI32();
    borrow.protocol = PROTOCOL_ID;
    borrow.to = event.transaction.from.toString(); // from since its a burn
    borrow.from = market.id;
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
    market: Market,
    amount: BigInt,
    principalPaid: BigInt,
    interestPaid: BigInt,
    late: boolean
): Repay {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const repay = new Repay(id);

    repay.hash = event.transaction.hash.toHexString();
    repay.logIndex = event.logIndex.toI32();
    repay.protocol = PROTOCOL_ID;
    repay.to = event.transaction.from.toString(); // from since its a burn
    repay.from = market.id;
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
    market: Market,
    amountRecoveredFromCollatoral: BigInt,
    defaultSufferedToPoolAndStake: BigInt,
    amountReturnedToBorrower: BigInt
): Liquidate {
    const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    const liquidate = new Liquidate(id);

    liquidate.hash = event.transaction.hash.toHexString();
    liquidate.logIndex = event.logIndex.toI32();
    liquidate.protocol = PROTOCOL_ID;
    liquidate.to = event.transaction.from.toString(); // from since its a burn
    liquidate.from = market.id;
    liquidate.blockNumber = event.block.number;
    liquidate.timestamp = event.block.timestamp;
    liquidate.market = market.id;
    liquidate.asset = market.inputToken;
    liquidate.amountUSD = liquidate.amount.toBigDecimal().times(market.inputTokenPriceUSD);
    liquidate._amountRecoveredFromCollatoral = amountRecoveredFromCollatoral;
    liquidate._defaultSufferedToPoolAndStake = defaultSufferedToPoolAndStake;
    liquidate._amountReturnedToBorrower = amountReturnedToBorrower;

    liquidate.amount = liquidate._amountRecoveredFromCollatoral.plus(liquidate._defaultSufferedToPoolAndStake);

    liquidate.save();
    return liquidate;
}
