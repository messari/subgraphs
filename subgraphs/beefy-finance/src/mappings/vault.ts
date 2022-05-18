import { ethers } from "ethers";
import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
const vaultABI = require("../../abis/BeefiVaultRegistryMATIC.json");
import { Vault } from "../../generated/schema";
import { UpgradeStrat } from "../../generated/templates/Vault/Vault";
import { getTokenOrCreate, getStrategyOrCreate } from "../utils/getters";
import { updateBalance } from "./strategy";

const NETWORK_SUFFIX = "-137";

export async function createVault(vaultAddress: string, block: any) {
  const vault = new Vault(vaultAddress + NETWORK_SUFFIX);
  //add parameters to vault
  vault.protocol = "Assign BeefyFinance"; //type YieldAggregator

  const vaultContract = new ethers.Contract(vaultAddress, vaultABI);
  vault.name = await vaultContract.name();
  vault.symbol = await vaultContract.symbol();
  vault.strategy = getStrategyOrCreate(
    (await vaultContract.strategy()).address,
    NETWORK_SUFFIX
  ).id;

  const inputToken = await vaultContract.want();
  vault.inputToken = getTokenOrCreate(
    inputToken.address,
    inputToken.name,
    inputToken.symbol,
    inputToken.decimals,
    NETWORK_SUFFIX
  );
  vault.outputToken = getTokenOrCreate(
    vaultContract.address,
    vaultContract.name,
    vaultContract.symbol,
    vaultContract.decimals,
    NETWORK_SUFFIX
  );

  vault.depositLimit = new BigInt(0); //TODO: verify if there is a depositLimit
  vault.fees = ["Assign Fee"]; //type [VaultFee] TODO: need to find contract where fees are stored
  vault.createdTimestamp = block.timestamp;
  vault.createdBlockNumber = block.number;
  vault.outputTokenSupply = new BigInt(await vaultContract.totalSupply());
  vault.pricePerShare = new BigDecimal(await vaultContract.pricePerFullShare());

  //Snapshots
  vault.dailySnapshots = ["Assign snapshots"]; //type [VaultDailySnapshot!]! @derivedFrom(field: "vault")
  vault.hourlySnapshots = ["Assign snapshots"]; //type [VaultHourlySnapshot!]! @derivedFrom(field: "vault")

  //Events
  vault.deposits = ["Assign FirstDeposit"]; //type [Deposit!]! @derivedFrom(field: "vault")
  vault.withdraws = ["Assign FirstWithdraw"]; //type [Withdraw!]! @derivedFrom(field: "vault")

  await updateBalance(getStrategyOrCreate(vault.strategy, NETWORK_SUFFIX));

  vault.save();
}

export function handleUpgradeStrat(event: UpgradeStrat) {
  const vault = Vault.load(event.address + NETWORK_SUFFIX);
  if (vault) {
    vault.strategy = getStrategyOrCreate(
      event.params.implementation.toHexString(),
      NETWORK_SUFFIX
    ).id;
    vault.save();
  }
}
