import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Deposit, Token, Vault } from "../../generated/schema";
import {
  UpgradeStrat,
  DepositCall,
  WantCall,
  ConstructorCall,
  //DepositAllCall,
} from "../../generated/templates/Vault/Vault";
import {
  getTokenOrCreate,
  getStrategyOrCreate,
  getVaultOrCreate,
} from "../utils/getters";
import { updateBalance } from "./strategy";

const NETWORK_SUFFIX: string = "-137";

export function handleDeposit(call: DepositCall): void {
  const vault = getVaultOrCreate(call.to.toHexString(), NETWORK_SUFFIX);

  vault.inputTokenBalance = vault.inputTokenBalance.plus(call.inputs._amount);
  //totalValueLockedUSD???

  const depositId = call.transaction.hash
    .toHexString()
    .concat(`-${call.transaction.nonce}`)
    .concat(NETWORK_SUFFIX);
  const deposit = new Deposit(depositId);
  deposit.save();

  vault.deposits.push(depositId);
  vault.save();
}

export function handleConstructor(call: ConstructorCall) {
  const vault = new Vault(call.to + NETWORK_SUFFIX);

  //add parameters to vault
  vault.protocol = "Assign BeefyFinance"; //type YieldAggregator
  vault.name = call.inputs._name;
  vault.symbol = call.inputs._symbol;

  vault.strategy = call.inputs._strategy.toHexString() + NETWORK_SUFFIX;
  //vault.inputToken = "NoToken";
  vault.outputToken = call.to + NETWORK_SUFFIX;
  vault.depositLimit = new BigInt(0); //TODO: verify if there is a depositLimit
  //vault.fees = ["Assign Fee"]; //type [VaultFee] TODO: need to find contract where fees are stored
  vault.createdTimestamp = call.block.timestamp;
  vault.createdBlockNumber = call.block.number;
  vault.totalValueLockedUSD = new BigDecimal(new BigInt(0));
  vault.inputTokenBalance = new BigInt(0);

  //Snapshots
  vault.dailySnapshots = ["Assign snapshots"]; //type [VaultDailySnapshot!]! @derivedFrom(field: "vault")
  vault.hourlySnapshots = ["Assign snapshots"]; //type [VaultHourlySnapshot!]! @derivedFrom(field: "vault")

  //Events
  vault.deposits = ["Assign FirstDeposit"]; //type [Deposit!]! @derivedFrom(field: "vault")
  vault.withdraws = ["Assign FirstWithdraw"]; //type [Withdraw!]! @derivedFrom(field: "vault")

  vault.save();
}

function handleUpgradeStrat(event: UpgradeStrat): void {
  const vault = Vault.load(event.address + NETWORK_SUFFIX);
  if (vault) {
    vault.strategy = getStrategyOrCreate(
      event.params.implementation.toHexString(),
      NETWORK_SUFFIX,
      vault
    ).id;
    vault.save();
  }
}
