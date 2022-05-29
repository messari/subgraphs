import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Deposit, Market, Withdraw } from "../../../generated/schema";
import { PROTOCOL_ID, ZERO_ADDRESS, ZERO_BI } from "../constants";

export function createDeposit(event: ethereum.Event, market: Market, amountMPTMinted: BigInt): Deposit {
    const id = event.transaction.hash.toString() + "-" + event.logIndex.toString();
    const deposit = new Deposit(id);

    deposit.hash = event.transaction.hash.toString();
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
    const id = event.transaction.hash.toString() + "-" + event.logIndex.toString();
    const withdraw = new Withdraw(id);

    withdraw.hash = event.transaction.hash.toString();
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
