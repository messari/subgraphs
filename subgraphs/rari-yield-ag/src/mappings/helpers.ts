// helper functions for ./mappings.ts

import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  INT_TWO,
  RARI_DEPLOYER,
  USDC_VAULT_ADDRESS,
  USDC_VAULT_MANAGER_ADDRESS,
  VaultFeeType,
  YIELD_VAULT_ADDRESS,
  YIELD_VAULT_MANAGER_ADDRESS,
} from "../common/utils/constants";
import { Deposit, Vault, VaultFee, Withdraw } from "../../generated/schema";
import {
  getOrCreateFinancials,
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateVaultFee,
  getOrCreateYieldAggregator,
} from "../common/getters";
import { exponentToBigDecimal } from "../common/utils/utils";
import { RariYieldFundManager } from "../../generated/RariYieldFundManager/RariYieldFundManager";
import { RariStableFundManager } from "../../generated/RariUSDCFundManager/RariStableFundManager";

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

  // update vault TVL
  let vault = getOrCreateVault(event, vaultAddress);
  updateTVL(vault);

  // update outputTokenPrice
  vault.outputTokenSupply = vault.outputTokenSupply!.plus(outputTokensMinted);
  let outputTokenDecimals = getOrCreateToken(vault.outputToken!).decimals;
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

  // update vault TVL
  let vault = getOrCreateVault(event, vaultAddress);
  updateTVL(vault);

  // update outputTokenPrice
  vault.outputTokenSupply = vault.outputTokenSupply!.minus(outputTokensBurned);
  let outputTokenDecimals = getOrCreateToken(vault.outputToken!).decimals;
  vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
    vault.outputTokenSupply!.toBigDecimal().div(exponentToBigDecimal(outputTokenDecimals)),
  );

  // calculate withdrawal fee
  let withdrawalFee = BIGDECIMAL_ZERO;
  if (vaultAddress == YIELD_VAULT_ADDRESS) {
    withdrawalFee = amountUSD.minus(afterFeeUSD).toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS));
    if (withdrawalFee.lt(BIGDECIMAL_ZERO)) {
      withdrawalFee = BIGDECIMAL_ZERO;
    }
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
  let perfFee: VaultFee = getOrCreateVaultFee(VaultFeeType.PERFORMANCE_FEE, vaultAddress);
  let tryWithdrawalFee: ethereum.CallResult<BigInt>;
  let tryPerfFee: ethereum.CallResult<BigInt>;

  if (vaultAddress == YIELD_VAULT_ADDRESS) {
    // get fees
    let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));
    let withdrawalFee = getOrCreateVaultFee(VaultFeeType.WITHDRAWAL_FEE, vaultAddress);
    tryWithdrawalFee = contract.try_getWithdrawalFeeRate();
    tryPerfFee = contract.try_getInterestFeeRate();

    if (!tryWithdrawalFee.reverted) {
      // only update fee if it was not reverted
      withdrawalFee.feePercentage = tryWithdrawalFee.value
        .toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2));
      withdrawalFee.save();
    }
  } else {
    // TODO: fix placeholder
    let contract = RariStableFundManager.bind(Address.fromString(USDC_VAULT_MANAGER_ADDRESS));
    tryPerfFee = contract.try_getInterestFeeRate();
  }

  if (!tryPerfFee.reverted) {
    // only update fee if it was not reverted
    perfFee.feePercentage = tryPerfFee.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS - 2));
    perfFee.save();
  }
}

// updates revenues (excludes withdrawal fees)
// extraFees are withdrawal fees in Yield pool
export function updateRevenues(event: ethereum.Event, vault: Vault, extraFee: BigDecimal): void {
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateYieldAggregator();

  // get raw interest accrued based on vault address
  let tryTotalInterest: ethereum.CallResult<BigInt>;
  if (vault.id == YIELD_VAULT_ADDRESS) {
    let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));
    tryTotalInterest = contract.try_getRawInterestAccrued();
  } else {
    // TODO: fix placeholder - must be usdc as of 1.3.4
    let contract = RariStableFundManager.bind(Address.fromString(USDC_VAULT_MANAGER_ADDRESS));
    tryTotalInterest = contract.try_getRawInterestAccrued();
  }

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

export function updateTVL(vault: Vault): void {
  let tryVaultTVL: ethereum.CallResult<BigInt>;
  if (vault.id == YIELD_VAULT_ADDRESS) {
    let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));
    tryVaultTVL = contract.try_getFundBalance();
  } else if (vault.id == USDC_VAULT_ADDRESS /*|| vault.id == DAI_VAULT_ADDRESS*/) {
    let contract = RariStableFundManager.bind(Address.fromString(USDC_VAULT_MANAGER_ADDRESS));
    tryVaultTVL = contract.try_getFundBalance();
  } else {
    // Must be Ether Manager
    // TODO: fix only placeholder
    let contract = RariStableFundManager.bind(Address.fromString(USDC_VAULT_MANAGER_ADDRESS));
    tryVaultTVL = contract.try_getFundBalance();
  }

  // get TVL and save
  vault.totalValueLockedUSD = tryVaultTVL.reverted
    ? BIGDECIMAL_ZERO
    : tryVaultTVL.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS));

  vault.save();
}
