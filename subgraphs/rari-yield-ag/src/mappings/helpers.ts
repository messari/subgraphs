// helper functions for ./mappings.ts

import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  RARI_DEPLOYER,
  RARI_YIELD_POOL_TOKEN,
  YIELD_VAULT_MANAGER_ADDRESS,
} from "../common/utils/constants";
import { Deposit, Withdraw } from "../../generated/schema";
import { getOrCreateToken, getOrCreateVault } from "../common/getters";
import { exponentToBigDecimal } from "../common/utils/utils";
import { RariYieldFundManager } from "../../generated/RariYieldFundManager/RariYieldFundManager";

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigInt,
  outputTokensMinted: BigInt,
  asset: string,
  vaultAddress: string,
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = hash.toHexString() + "-" + logIndex.toString();

  // create Deposit
  let deposit = new Deposit(id);

  // get (or create) asset
  let token = getOrCreateToken(asset);

  // fill in vars
  deposit.hash = hash.toHexString();
  deposit.logIndex = logIndex.toI32();
  deposit.protocol = RARI_DEPLOYER;
  deposit.to = event.address.toHexString();
  deposit.from = event.transaction.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.asset = token.id;
  deposit.amount = amount;
  deposit.amountUSD = amountUSD.toBigDecimal().div(exponentToBigDecimal(token.decimals));
  deposit.vault = vaultAddress;

  deposit.save();

  // load in vault contract
  let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));

  // update vault
  let vault = getOrCreateVault(event, vaultAddress);
  let tryVaultTVL = contract.try_getFundBalance();
  vault.totalValueLockedUSD = tryVaultTVL.reverted
    ? BIGDECIMAL_ZERO
    : tryVaultTVL.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS));
  vault.outputTokenSupply = vault.outputTokenSupply!.plus(outputTokensMinted);

  // update outputTokenPrice
  let outputTokenDecimals = getOrCreateToken(RARI_YIELD_POOL_TOKEN).decimals;
  vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
    vault.outputTokenSupply!.toBigDecimal().div(exponentToBigDecimal(outputTokenDecimals)),
  );

  // TODO calculate fees

  // TODO: get inputTokenBalances working

  vault.save();
}

export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigInt,
  outputTokensBurned: BigInt,
  asset: string,
  vaultAddress: string,
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = hash.toHexString() + "-" + logIndex.toString();

  // create Deposit
  let withdraw = new Withdraw(id);

  // get (or create) token
  let token = getOrCreateToken(asset);

  // populate vars,
  withdraw.hash = hash.toHexString();
  withdraw.logIndex = logIndex.toI32();
  withdraw.protocol = RARI_DEPLOYER;
  withdraw.to = event.address.toHexString();
  withdraw.from = event.transaction.from.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.asset = token.id;
  withdraw.amount = amount;
  withdraw.amountUSD = amountUSD.toBigDecimal().div(exponentToBigDecimal(token.decimals));
  withdraw.vault = vaultAddress;

  withdraw.save();

  // load in vault contract
  let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));

  // update vault
  let vault = getOrCreateVault(event, vaultAddress);
  let tryVaultTVL = contract.try_getFundBalance();
  vault.totalValueLockedUSD = tryVaultTVL.reverted
    ? BIGDECIMAL_ZERO
    : tryVaultTVL.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS));
  vault.outputTokenSupply = vault.outputTokenSupply!.minus(outputTokensBurned);

  // update outputTokenPrice
  let outputTokenDecimals = getOrCreateToken(RARI_YIELD_POOL_TOKEN).decimals;
  vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
    vault.outputTokenSupply!.toBigDecimal().div(exponentToBigDecimal(outputTokenDecimals)),
  );

  // TODO calculate fees

  // TODO: get inputTokenBalances working

  vault.save();
}

/////////////////////////
//// Updates Helpers ////
/////////////////////////

// TODO
