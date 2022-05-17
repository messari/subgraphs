import { ethers } from "ethers";
import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
const vaultABI = require("../../abis/BeefiVaultRegistryMATIC.json");
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
import { UpgradeStrat, Transfer } from "../../generated/templates/Vault/Vault";
import { AddressZero } from "@ethersproject/constants";

const NETWORK_PREFIX = "MATIC";

export async function createVault(vaultAddress: string, block: any) {
  const vault = new Vault("MATIC" + vaultAddress);
  //add parameters to vault
  vault.protocol = "Assign BeefyFinance"; //type YieldAggregator

  const vaultContract = new ethers.Contract(vaultAddress, vaultABI);
  vault.name = await vaultContract.name();
  vault.symbol = await vaultContract.symbol();
  vault.strategy = getStrategyOrCreate();

  const inputToken = await vaultContract.want();
  vault.inputToken = getTokenOrCreate(
    inputToken.address,
    inputToken.name,
    inputToken.symbol,
    inputToken.decimals
  );
  vault.outputToken = getTokenOrCreate(
    vaultContract.address,
    vaultContract.name,
    vaultContract.symbol,
    vaultContract.decimals
  );

  vault.fees = ["Assign Fee"]; //type [VaultFee] need to find contract where fees are stored
  vault.createdTimestamp = block.timestamp;
  vault.createdBlockNumber = block.number;
  vault.totalValueLockedUSD = new BigDecimal(new BigInt(0));
  vault.inputTokenBalance = new BigInt(0);
  vault.outputTokenSupply = new BigInt(await vaultContract.totalSupply());

  //Snapshots
  vault.dailySnapshots = ["Assign snapshots"]; //type [VaultDailySnapshot!]! @derivedFrom(field: "vault")
  vault.hourlySnapshots = ["Assign snapshots"]; //type [VaultHourlySnapshot!]! @derivedFrom(field: "vault")

  //Events
  vault.deposits = ["Assign FirstDeposit"]; //type [Deposit!]! @derivedFrom(field: "vault")
  vault.withdraws = ["Assign FirstWithdraw"]; //type [Withdraw!]! @derivedFrom(field: "vault")

  vault.save();
}

export function handleUpgradeStrat(event: UpgradeStrat) {
  const vault = Vault.load(NETWORK_PREFIX + event.address);
  if (vault) {
    vault.strategy = getStrategyOrCreate(event.params.implementation);
    vault.save();
  }
}

export async function handleTransfer(event: Transfer) {
  const vault = Vault.load(NETWORK_PREFIX + event.address);
  if (vault) {
    if (event.params.from.toHexString() == AddressZero) {
      const vaultContract = new ethers.Contract(
        event.address.toHexString(),
        vaultABI
      );
      vault.totalValueLockedUSD = vault.totalValueLockedUSD.plus(
        (await vaultContract.getPricePerFullShare()).mul(event.params.value)
      );
      //need to find a way to get amount of tokens deposited!
    } else if (event.params.to.toHexString() == AddressZero) {
      const vaultContract = new ethers.Contract(
        event.address.toHexString(),
        vaultABI
      );
      vault.totalValueLockedUSD = vault.totalValueLockedUSD.minus(
        (await vaultContract.getPricePerFullShare()).mul(event.params.value)
      );
    }
  }
}

function getTokenOrCreate(
  tokenAddress: string,
  tokenName: string,
  tokenSymbol: string,
  tokenDecimals: number
): string {
  const tokenId = NETWORK_PREFIX + tokenAddress;
  let token = Token.load(tokenId);
  if (token == null) {
    token = new Token(tokenId);
    token.name = tokenName;
    token.symbol = tokenSymbol;
    token.decimals = tokenDecimals;
  }
  return tokenId;
}
