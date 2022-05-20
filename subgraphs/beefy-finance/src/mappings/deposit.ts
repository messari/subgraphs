import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Deposit, Vault } from "../../generated/schema";
import {
  BeefyStrategy,
  Deposit as DepositEvent,
} from "../../generated/ExampleVault/BeefyStrategy";
import {
  getBeefyFinanceOrCreate,
  getTokenOrCreate,
  getVaultOrCreate,
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
  deposit.protocol = getBeefyFinanceOrCreate(networkSuffix).id;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;

  const vaultContract = BeefyStrategy.bind(event.address);
  deposit.asset = getTokenOrCreate(vaultContract.want(), networkSuffix).id;
  deposit.amount = depositedAmount;
  //TODO: deposit.amountUSD

  deposit.vault = getVaultOrCreate(
    event.address,
    event.block,
    networkSuffix
  ).id;

  deposit.save();
  return deposit;
}

export function getOrCreateFirstDeposit(vault: Vault): Deposit {
  let deposit = Deposit.load("MockDeposit");
  if (!deposit) {
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    deposit = new Deposit("MockDeposit");

    deposit.hash = zeroAddress;
    deposit.logIndex = 0;
    deposit.protocol = getBeefyFinanceOrCreate(vault.id.split("-")[1]).id;
    deposit.blockNumber = new BigInt(0);
    deposit.timestamp = new BigInt(0);
    deposit.asset = zeroAddress;
    deposit.amount = new BigInt(0);
    deposit.vault = vault.id;

    deposit.save();
  }

  return deposit;
}
