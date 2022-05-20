import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Vault, Withdraw } from "../../generated/schema";
import {
  BeefyStrategy,
  Withdraw as WithdrawEvent,
} from "../../generated/ExampleVault/BeefyStrategy";
import {
  getBeefyFinanceOrCreate,
  getTokenOrCreate,
  getVaultOrCreate,
} from "../utils/getters";

export function createWithdraw(
  event: WithdrawEvent,
  withdrawnAmount: BigInt,
  networkSuffix: string
): Withdraw {
  const withdraw = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat(`-${event.transaction.index}`)
      .concat(networkSuffix)
  );

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.transaction.index.toI32();
  withdraw.protocol = getBeefyFinanceOrCreate(networkSuffix).id;
  //withdraw.to = event.address.toHexString();
  //withdraw.from = call.from.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;

  const strategyContract = BeefyStrategy.bind(event.address);
  withdraw.asset = getTokenOrCreate(strategyContract.want(), networkSuffix).id;
  withdraw.amount = withdrawnAmount;
  //TODO: withdraw.amountUSD

  withdraw.vault = getVaultOrCreate(
    event.address,
    event.block,
    networkSuffix
  ).id;

  withdraw.save();
  return withdraw;
}

export function getOrCreateFirstWithdraw(vault: Vault): Withdraw {
  let withdraw = Withdraw.load("MockWithdraw");
  if (!withdraw) {
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    withdraw = new Withdraw("MockWithdraw");

    withdraw.hash = zeroAddress;
    withdraw.logIndex = 0;
    withdraw.protocol = getBeefyFinanceOrCreate(vault.id.split("-")[1]).id;

    //withdraw.to = zeroAddress;
    //withdraw.from = zeroAddress;
    withdraw.blockNumber = new BigInt(0);
    withdraw.timestamp = new BigInt(0);
    withdraw.asset = zeroAddress;
    withdraw.amount = new BigInt(0);
    //withdraw.amountUSD = new BigDecimal(new BigInt(0));
    withdraw.vault = vault.id;

    withdraw.save();
  }
  return withdraw;
}
