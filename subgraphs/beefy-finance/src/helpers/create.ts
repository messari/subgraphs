import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  BeefiVaultRegistryMATIC,
  OwnershipTransferred,
  VaultsRegistered,
  VaultsRetireStatusUpdated,
} from "../../generated/BeefiVaultRegistryMATIC/BeefiVaultRegistryMATIC";
import {
  Deposit,
  Withdraw,
  Vault,
  VaultDailySnapshot,
  VaultHourlySnapshot,
  VaultFee,
  YieldAggregator,
  Token,
} from "../../generated/schema";

export function createVault(vaultId: String, block: any): Vault {
  const vault = new Vault(vaultId.toString());
  //add parameters to vault!
  vault.protocol = "Assign BeefyFinance"; //type YieldAggregator
  vault.inputToken = "Assign Token"; //type Token
  vault.outputToken = "Assign Token"; //type Token
  vault.fees = "Assign Fee"; //type [VaultFee]
  vault.createdTimestamp = block.timestamp;
  vault.createdBlockNumber = block.number;
  vault.totalValueLockedUSD = new BigDecimal(new BigInt(0));
  vault.inputTokenBalance = new BigInt(0);
  vault.outputTokenSupply = new BigInt(0);

  //Snapshots
  vault.dailySnapshots = "Assign snapshots"; //type [VaultDailySnapshot!]! @derivedFrom(field: "vault")
  vault.hourlySnapshots = "Assign snapshots"; //type [VaultHourlySnapshot!]! @derivedFrom(field: "vault")

  //Events
  vault.deposits = ["Assign FirstDeposit"]; //type [Deposit!]! @derivedFrom(field: "vault")
  vault.withdraws = ["Assign FirstWithdraw"]; //type [Withdraw!]! @derivedFrom(field: "vault")

  return vault;
}
