// helper functions for ./mappings.ts

import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  INT_TWO,
  RARI_DEPLOYER,
  RARI_YIELD_POOL_TOKEN,
  VaultFeeType,
  YIELD_VAULT_MANAGER_ADDRESS,
} from "../common/utils/constants";
import { Deposit, Vault, Withdraw } from "../../generated/schema";
import {
  getOrCreateFinancials,
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateVaultFee,
  getOrCreateYieldAggregator,
} from "../common/getters";
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

  // update fees and revenues
  updateYieldFees(vaultAddress);
  updateRevenues(event, vault, BIGDECIMAL_ZERO);

  // TODO: get inputTokenBalances working

  vault.save();
}

export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigInt,
  afterFeeUSD: BigInt,
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

  // calculate withdrawal fee
  let withdrawalFee = amountUSD.minus(afterFeeUSD).toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS));
  if (withdrawalFee.lt(BIGDECIMAL_ZERO)) {
    withdrawalFee = BIGDECIMAL_ZERO;
  }

  // update fees and revenues
  updateYieldFees(vaultAddress);
  updateRevenues(event, vault, withdrawalFee);

  // TODO: get inputTokenBalances working

  vault.save();
}

/////////////////////////
//// Updates Helpers ////
/////////////////////////

// updates yield fees if necessary
export function updateYieldFees(vaultAddress: string): void {
  // grab fees
  let withdrawalFee = getOrCreateVaultFee(VaultFeeType.WITHDRAWAL_FEE, vaultAddress);
  let perfFee = getOrCreateVaultFee(VaultFeeType.PERFORMANCE_FEE, vaultAddress);

  // get fees
  let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));
  let tryWithdrawalFee = contract.try_getWithdrawalFeeRate();
  if (!tryWithdrawalFee.reverted) {
    // only update fee if it was not reverted
    withdrawalFee.feePercentage = tryWithdrawalFee.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS - 2));
    withdrawalFee.save();
  }

  let tryPerfFee = contract.try_getInterestFeeRate();
  if (!tryPerfFee.reverted) {
    // only update fee if it was not reverted
    perfFee.feePercentage = tryPerfFee.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS - 2));
    perfFee.save();
  }
}

// updates revenues (excludes withdrawal fees)
// extraFees are withdrawal fees in Yield pool
export function updateRevenues(event: ethereum.Event, vault: Vault, extraFee: BigDecimal): void {
  let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateYieldAggregator();

  let tryTotalInterest = contract.try_getRawInterestAccrued();
  if (!tryTotalInterest.reverted) {
    let prevInterest = vault._currentInterestAccruedUSD;
    let updatedInterest = tryTotalInterest.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS));
    if (prevInterest.gt(updatedInterest)) {
      // do not calculate fees b/c old interest is greater than current
      // this means net deposits and interests are out of whack
      // ie, someone just deposited or withdrew a large amount of $$
      log.warning("NEGATIVE FEES: extras: {}", [extraFee.toString()]);
    } else {
      let newTotalInterest = updatedInterest.minus(prevInterest);
      let performanceFee = getOrCreateVaultFee(VaultFeeType.PERFORMANCE_FEE, vault.id).feePercentage!.div(
        exponentToBigDecimal(INT_TWO),
      );
      let newFees = newTotalInterest.times(performanceFee);
      let newInterest = newTotalInterest.times(BIGDECIMAL_ONE.minus(performanceFee));

      // add new interests
      financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(newTotalInterest);
      financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(newFees);
      financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(newInterest);
      protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(newTotalInterest);
      protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(newFees);
      protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(newInterest);
    }
  }

  // add on extra fees (ie, withdrawal fees)
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(extraFee);
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(extraFee);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(extraFee);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(extraFee);

  vault.save();
  protocol.save();
  financialMetrics.save();
}
