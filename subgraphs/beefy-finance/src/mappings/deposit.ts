import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Deposit, Strategy, Vault } from "../../generated/schema";
import {
  BeefyStrategy,
  Deposit as DepositEvent,
} from "../../generated/ExampleStrategy/BeefyStrategy";
import {
  getBeefyFinanceOrCreate,
  getStrategyOrCreate,
  getTokenOrCreate,
} from "../utils/getters";

export function createDeposit(
  event: DepositEvent,
  depositedAmount: BigInt,
  networkSuffix: string
): Deposit {
  const deposit = new Deposit(
    event.transaction.hash
      .toHexString()
      .concat(`-${event.transaction.index}`)
      .concat(networkSuffix)
  );

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.transaction.index.toI32();
  deposit.protocol = getBeefyFinanceOrCreate().id;
  //deposit.to = event.address.toHexString();
  //deposit.from = call.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;

  const strategyContract = BeefyStrategy.bind(event.address);
  deposit.asset = getTokenOrCreate(strategyContract.want(), networkSuffix).id;
  deposit.amount = depositedAmount;
  //TODO: deposit.amountUSD

  deposit.strategy = getStrategyOrCreate(
    event.address,
    event.block,
    networkSuffix
  ).id;

  deposit.save();
  return deposit;
}

export function getOrCreateFirstDeposit(strategy: Strategy): Deposit {
  let deposit = Deposit.load("MockDeposit");
  if (!deposit) {
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    deposit = new Deposit("MockDeposit");

    deposit.hash = zeroAddress;
    deposit.logIndex = 0;
    deposit.protocol = getBeefyFinanceOrCreate().id;

    //deposit.to = zeroAddress;
    //deposit.from = zeroAddress;
    deposit.blockNumber = new BigInt(0);
    deposit.timestamp = new BigInt(0);
    deposit.asset = zeroAddress;
    deposit.amount = new BigInt(0);
    //deposit.amountUSD = new BigDecimal(new BigInt(0));
    //deposit.vault = vault.id;
    deposit.strategy = strategy.id;

    deposit.save();
  }

  return deposit;
}
