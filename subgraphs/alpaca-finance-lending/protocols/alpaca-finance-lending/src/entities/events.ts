import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
    Borrow,
    Deposit,
    Liquidate,
    Repay,
    Withdraw,
} from "../../../../generated/schema";
import { BIGDECIMAL_ONE, BIGINT_ZERO } from "../../../../src/utils/constants";
import { fetchPriceSimpleOracle, PositionSide } from "../utils/constants";
import { getOrCreateAccount, incrementAccountDepositCount, incrementAccountWithdrawCount } from "./account";
import { Vault as VaultContract } from "../../../../generated/FairLaunch/Vault";
import { bigIntToBigDecimal } from "../../../../src/utils/numbers";
// import {
//     getOrCreateAccount,
//     incrementAccountBorrowCount,
//     incrementAccountDepositCount,
//     incrementAccountLiquidationCount,
//     incrementAccountLiquidatorCount,
//     incrementAccountRepayCount,
//     incrementAccountWithdrawCount,
// } from "./account";
import {
    addMarketDepositVolume,
    addMarketWithdrawVolume,
    createMarket,
    getMarket,
    updateInputTokenBalance,
} from "./market";
import { checkIfPositionClosed, getOrCreateUserPosition, incrementPositionDepositCount, incrementPositionWithdrawCount, updateUserLenderPosition } from "./position";
// import {
//     checkIfPositionClosed,
//     getOrCreateUserPosition,
//     incrementPositionBorrowCount,
//     incrementPositionDepositCount,
//     incrementPositionLiquidationCount,
//     incrementPositionRepayCount,
//     incrementPositionWithdrawCount,
// } from "./position";
// import { amountInUSD } from "./price";
import { getOrCreateToken } from "./token";
import { incrementProtocolDepositCount, incrementProtocolWithdrawCount } from "./usage";
// import {
//     incrementProtocolBorrowCount,
//     incrementProtocolDepositCount,
//     incrementProtocolLiquidateCount,
//     incrementProtocolRepayCount,
//     incrementProtocolWithdrawCount,
//     updateUsageMetrics,
// } from "./usage";

export function createDeposit(
    event: ethereum.Event,
    poolAddress: Address,
    inputToken: Address,
    user: Address,
    amount: BigInt,
    vaultInstance: VaultContract
): Deposit {
    if (amount.lt(BIGINT_ZERO)) {
        log.critical("Invalid deposit amount: {}", [amount.toString()]);
    }
    let market = createMarket(event, poolAddress, inputToken);
    const account = getOrCreateAccount(user);
    const position = getOrCreateUserPosition(
        event,
        account,
        market,
        PositionSide.LENDER
    );
    const asset = getOrCreateToken(inputToken);
    const deposit = new Deposit(
        `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    );
    const amountInUSD = bigIntToBigDecimal(fetchPriceSimpleOracle(inputToken).times(amount).div(BigInt.fromString("10").pow(<u8>asset.decimals)));
    deposit.hash = event.transaction.hash.toHexString();
    deposit.nonce = event.transaction.nonce;
    deposit.logIndex = event.logIndex.toI32();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.account = account.id;
    deposit.market = market.id;
    deposit.position = position.id;
    deposit.asset = asset.id;
    deposit.amount = amount;
    deposit.amountUSD = amountInUSD;
    deposit.save();
    // updateUsageMetrics(event, event.transaction.from);
    market = updateInputTokenBalance(market, vaultInstance);
    addMarketDepositVolume(event, market, deposit.amountUSD);
    updateUserLenderPosition(event, user, market, position.balance.plus(deposit.amount))
    incrementProtocolDepositCount(event, account);
    incrementAccountDepositCount(account);
    incrementPositionDepositCount(position);
    return deposit;
}

export function createWithdraw(
    event: ethereum.Event,
    poolAddress: Address,
    inputToken: Address,
    user: Address,
    amount: BigInt,
    vaultInstance: VaultContract
): Withdraw {

    log.info('enter withdraw creation functions ' + amount.toString() + ' ' + event.transaction.hash.toHexString(), [])
    if (amount.lt(BIGINT_ZERO)) {
        log.critical("Invalid withdraw amount: {}", [amount.toString()]);
    }
    let market = createMarket(event, poolAddress, inputToken);
    const account = getOrCreateAccount(user);
    let position = getOrCreateUserPosition(
        event,
        account,
        market,
        PositionSide.LENDER
    );
    const asset = getOrCreateToken(inputToken);
    const withdraw = new Withdraw(
        `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
    );
    const amountInUSD = bigIntToBigDecimal(fetchPriceSimpleOracle(inputToken).times(amount).div(BigInt.fromString("10").pow(<u8>asset.decimals)));
    withdraw.hash = event.transaction.hash.toHexString();
    withdraw.nonce = event.transaction.nonce;
    withdraw.logIndex = event.logIndex.toI32();
    withdraw.blockNumber = event.block.number;
    withdraw.timestamp = event.block.timestamp;
    withdraw.account = account.id;
    withdraw.market = market.id;
    withdraw.position = position.id;
    withdraw.asset = asset.id;
    withdraw.amount = amount;
    withdraw.amountUSD = amountInUSD;
    withdraw.save();
    // updateUsageMetrics(event, user);
    market = updateInputTokenBalance(market, vaultInstance);
    addMarketWithdrawVolume(event, market, withdraw.amountUSD);
    position = updateUserLenderPosition(event, user, market, position.balance.minus(withdraw.amount))

    incrementProtocolWithdrawCount(event);
    incrementAccountWithdrawCount(account);
    incrementPositionWithdrawCount(position);
    checkIfPositionClosed(event, account, market, position);
    return withdraw;
}