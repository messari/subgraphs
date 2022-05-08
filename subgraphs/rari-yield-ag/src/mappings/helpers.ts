// helper functions for ./mappings.ts
import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DAI_VAULT_ADDRESS,
  DAI_VAULT_MANAGER_ADDRESS,
  DEFAULT_DECIMALS,
  ETHER_VAULT_MANAGER_ADDRESS,
  ETH_ADDRESS,
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
import { RariEtherFundManager } from "../../generated/RariEtherFundManager/RariEtherFundManager";
import { getUsdPrice } from "../prices";

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigDecimal,
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
  let vault = getOrCreateVault(event, vaultAddress, token.id);
  deposit.vault = vault.id;

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
  deposit.amountUSD = amountUSD;

  deposit.save();

  updateTVL(event);

  // update outputTokenPrice
  vault.outputTokenSupply = vault.outputTokenSupply!.plus(outputTokensMinted);
  vault.outputTokenPriceUSD = getOutputTokenPrice(event, vaultAddress);

  // update fees/revenues/token balances
  updateYieldFees(vaultAddress);
  updateRevenues(event, vault, BIGDECIMAL_ZERO);
  updateInputTokenBalance(vault);

  // calculate pricePerShare
  vault.pricePerShare = vault.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .div(vault.outputTokenSupply!.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)));

  vault.save();
}

export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigDecimal,
  afterFeeUSD: BigInt, // used to calculate withdrawal fee - only used in Yield Pool
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
  let vault = getOrCreateVault(event, vaultAddress, token.id);
  withdraw.vault = vault.id;

  // populate vars,
  withdraw.hash = hash.toHexString();
  withdraw.logIndex = logIndex.toI32();
  withdraw.protocol = RARI_DEPLOYER;
  withdraw.to = event.transaction.from.toHexString();
  withdraw.from = event.address.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.asset = token.id;
  withdraw.amount = amount;
  withdraw.amountUSD = amountUSD;

  withdraw.save();

  updateTVL(event);

  // update outputTokenPrice
  vault.outputTokenSupply = vault.outputTokenSupply!.minus(outputTokensBurned);
  vault.outputTokenPriceUSD = getOutputTokenPrice(event, vaultAddress);

  // calculate withdrawal fee
  let withdrawalFee = BIGDECIMAL_ZERO;
  if (vaultAddress == YIELD_VAULT_ADDRESS) {
    withdrawalFee = amountUSD.minus(afterFeeUSD.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)));
    if (withdrawalFee.lt(BIGDECIMAL_ZERO)) {
      withdrawalFee = BIGDECIMAL_ZERO;
    }
  }

  // update fees/revenues/token balances
  updateYieldFees(vaultAddress);
  updateRevenues(event, vault, withdrawalFee);
  updateInputTokenBalance(vault);

  // calculate pricePerShare
  vault.pricePerShare = vault.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    .div(vault.outputTokenSupply!.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)));

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
  } else if (vaultAddress == USDC_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(Address.fromString(USDC_VAULT_MANAGER_ADDRESS));
    tryPerfFee = contract.try_getInterestFeeRate();
  } else if (vaultAddress == DAI_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(Address.fromString(DAI_VAULT_MANAGER_ADDRESS));
    tryPerfFee = contract.try_getInterestFeeRate();
  } else {
    let contract = RariEtherFundManager.bind(Address.fromString(ETHER_VAULT_MANAGER_ADDRESS));
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
  if (vault._contractAddress == YIELD_VAULT_ADDRESS) {
    let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));
    tryTotalInterest = contract.try_getRawInterestAccrued();
  } else if (vault._contractAddress == USDC_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(Address.fromString(USDC_VAULT_MANAGER_ADDRESS));
    tryTotalInterest = contract.try_getRawInterestAccrued();
  } else if (vault._contractAddress == DAI_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(Address.fromString(DAI_VAULT_MANAGER_ADDRESS));
    tryTotalInterest = contract.try_getRawInterestAccrued();
  } else {
    let contract = RariEtherFundManager.bind(Address.fromString(ETHER_VAULT_MANAGER_ADDRESS));
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
      let performanceFee = getOrCreateVaultFee(VaultFeeType.PERFORMANCE_FEE, vault._contractAddress).feePercentage!.div(
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

      // update interest in all vaults with the same _contractAddress
      // prevents double counting
      for (let i = 0; i < protocol._vaultList.length; i++) {
        let splitArr = protocol._vaultList[i].split("-", 2);
        let _vaultAddress = splitArr[0];
        let tokenAddress = splitArr[1];
        let _vault = getOrCreateVault(event, _vaultAddress, tokenAddress);

        if (_vault._contractAddress == vault._contractAddress) {
          _vault._currentInterestAccruedUSD = updatedInterest; // only updates when non-negative newInterest
          _vault.save();
        }
      }
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

export function updateTVL(event: ethereum.Event): void {
  let protocol = getOrCreateYieldAggregator();
  let totalValueLockedUSD = BIGDECIMAL_ZERO;

  // loop through vaults and update each
  for (let i = 0; i < protocol._vaultList.length; i++) {
    let splitArr = protocol._vaultList[i].split("-", 2);
    let vaultAddress = splitArr[0];
    let tokenAddress = splitArr[1];
    let vault = getOrCreateVault(event, vaultAddress, tokenAddress);
    let inputToken = getOrCreateToken(vault.inputToken);

    // if...else to grab TVL for correct vault
    if (vaultAddress == YIELD_VAULT_ADDRESS) {
      let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));
      let tryVaultTVL = contract.try_getRawFundBalance1(inputToken.symbol);
      vault.totalValueLockedUSD = tryVaultTVL.reverted
        ? vault.totalValueLockedUSD
        : getUsdPrice(
            Address.fromString(vault.inputToken),
            tryVaultTVL.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)),
          );
    } else if (vaultAddress == USDC_VAULT_ADDRESS) {
      let contract = RariStableFundManager.bind(Address.fromString(USDC_VAULT_MANAGER_ADDRESS));
      let tryVaultTVL = contract.try_getRawFundBalance1(inputToken.symbol);
      vault.totalValueLockedUSD = tryVaultTVL.reverted
        ? vault.totalValueLockedUSD
        : getUsdPrice(
            Address.fromString(vault.inputToken),
            tryVaultTVL.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)),
          );
    } else if (vaultAddress == DAI_VAULT_ADDRESS) {
      let contract = RariStableFundManager.bind(Address.fromString(DAI_VAULT_MANAGER_ADDRESS));
      let tryVaultTVL = contract.try_getRawFundBalance1(inputToken.symbol);
      vault.totalValueLockedUSD = tryVaultTVL.reverted
        ? vault.totalValueLockedUSD
        : getUsdPrice(
            Address.fromString(vault.inputToken),
            tryVaultTVL.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)),
          );
    } else {
      let contract = RariEtherFundManager.bind(Address.fromString(ETHER_VAULT_MANAGER_ADDRESS));
      let tryVaultTVL = contract.try_getRawFundBalance(); // in ETH
      vault.totalValueLockedUSD = tryVaultTVL.reverted
        ? vault.totalValueLockedUSD
        : getUsdPrice(
            Address.fromString(ETH_ADDRESS),
            tryVaultTVL.value.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)),
          );
    }

    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
    vault.save();
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

// updates the input balance of a given pool
export function updateInputTokenBalance(vault: Vault): void {
  let tryFundBalance: ethereum.CallResult<BigInt>;
  let inputToken = getOrCreateToken(vault.inputToken);

  if (vault._contractAddress == YIELD_VAULT_ADDRESS) {
    let contract = RariYieldFundManager.bind(Address.fromString(YIELD_VAULT_MANAGER_ADDRESS));
    tryFundBalance = contract.try_getRawFundBalance1(inputToken.symbol);
  } else if (vault._contractAddress == USDC_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(Address.fromString(USDC_VAULT_MANAGER_ADDRESS));
    tryFundBalance = contract.try_getRawFundBalance1(inputToken.symbol);
  } else if (vault._contractAddress == DAI_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(Address.fromString(DAI_VAULT_MANAGER_ADDRESS));
    tryFundBalance = contract.try_getRawFundBalance1(inputToken.symbol);
  } else {
    // must be Ether vault
    let contract = RariEtherFundManager.bind(Address.fromString(ETHER_VAULT_MANAGER_ADDRESS));
    tryFundBalance = contract.try_getRawFundBalance();
  }

  // udpate balance if not reverted
  if (!tryFundBalance.reverted) {
    vault.inputTokenBalance = tryFundBalance.value;
  }

  vault.save();
}

// returns output token price in USD
export function getOutputTokenPrice(event: ethereum.Event, vaultAddress: string): BigDecimal {
  // loop through vaults and only grab ones with vaultAddress _contractAddress
  let protocol = getOrCreateYieldAggregator();
  let outputTokenSupply = BIGINT_ZERO;
  let vaultTVL = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._vaultList.length; i++) {
    let splitArr = protocol._vaultList[i].split("-", 2);
    let _vaultAddress = splitArr[0];
    let tokenAddress = splitArr[1];
    let vault = getOrCreateVault(event, _vaultAddress, tokenAddress);

    if (vault._contractAddress == vaultAddress) {
      // add up only when we hit a vault that matches
      outputTokenSupply = outputTokenSupply.plus(vault.outputTokenSupply!);
      vaultTVL = vaultTVL.plus(vault.totalValueLockedUSD);
    }
  }

  // calc outputTokenPrice in USD for vaultAddress
  if (outputTokenSupply.equals(BIGINT_ZERO) || vaultTVL.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO;
  }
  return vaultTVL.div(outputTokenSupply.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS)));
}
