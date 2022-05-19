import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Deposit, Vault, Withdraw } from "../../generated/schema";
import {
  UpgradeStrat,
  DepositCall,
  ConstructorCall,
  BeefyVault,
  WithdrawCall,
} from "../../generated/templates/BeefyVault/BeefyVault";
import {
  getTokenOrCreate,
  getStrategyOrCreate,
  getVaultOrCreate,
} from "../utils/getters";
import { createDeposit } from "./deposit";
import { createWithdraw } from "./withdraw";

const NETWORK_SUFFIX: string = "-137";

export function handleDepositCall(call: DepositCall): void {
  const vault = getVaultOrCreate(call.to, NETWORK_SUFFIX);
  const vaultContract = BeefyVault.bind(call.to);

  vault.inputTokenBalance = vault.inputTokenBalance.plus(call.inputs._amount);
  //totalValueLockedUSD???
  vault.outputTokenSupply = vaultContract.totalSupply();

  const deposit = createDeposit(call, NETWORK_SUFFIX);
  deposit.save();

  vault.deposits.push(deposit.id);
  vault.save();
}

export function handleWithdrawCall(call: WithdrawCall): void {
  const vault = getVaultOrCreate(call.to, NETWORK_SUFFIX);
  const vaultContract = BeefyVault.bind(call.to);

  vault.inputTokenBalance = vaultContract.balance();
  //vault.totalValueLockedUSD
  vault.outputTokenSupply = vaultContract.totalSupply();

  const withdraw = createWithdraw(call, NETWORK_SUFFIX);
  withdraw.save();

  vault.withdraws.push(withdraw.id);
  vault.save();
}

function handleUpgradeStrat(event: UpgradeStrat): void {
  //if properties of entities aren't needed, it's faster to instantiate a new vault and save on top of the old one
  const vault = new Vault(event.address + NETWORK_SUFFIX);

  vault.strategy = getStrategyOrCreate(
    event.params.implementation,
    NETWORK_SUFFIX,
    vault
  ).id;
  vault.save();
}

export function handleConstructor(call: ConstructorCall): void {
  const vault = new Vault(call.to.toHexString() + NETWORK_SUFFIX);
  const vaultContract = BeefyVault.bind(call.to);
  //add parameters to vault
  vault.protocol = "Assign BeefyFinance"; //type YieldAggregator
  vault.name = call.inputs._name;
  vault.symbol = call.inputs._symbol;

  vault.strategy = call.inputs._strategy.toHexString() + NETWORK_SUFFIX;
  vault.inputToken = getTokenOrCreate(vaultContract.want(), NETWORK_SUFFIX).id;
  vault.outputToken = getTokenOrCreate(call.to, NETWORK_SUFFIX).id;
  vault.depositLimit = new BigInt(0); //TODO: verify if there is a depositLimit
  //vault.fees = ["Assign Fee"]; //type [VaultFee] TODO: need to find contract where fees are stored
  vault.createdTimestamp = call.block.timestamp;
  vault.createdBlockNumber = call.block.number;
  vault.inputTokenBalance = vaultContract.balance();
  vault.totalValueLockedUSD = new BigDecimal(new BigInt(0));

  vault.save();
}
