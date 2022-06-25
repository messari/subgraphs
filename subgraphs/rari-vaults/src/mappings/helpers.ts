// helper functions for ./mappings.ts
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
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
  getOrCreateVaultInterest,
  getOrCreateYieldAggregator,
} from "../common/getters";
import { exponentToBigDecimal } from "../common/utils/utils";
import { RariYieldFundManager } from "../../generated/RariYieldFundManager/RariYieldFundManager";
import { RariStableFundManager } from "../../generated/RariUSDCFundManager/RariStableFundManager";
import { RariEtherFundManager } from "../../generated/RariEtherFundManager/RariEtherFundManager";
import { getUsdPrice } from "../prices";
import { ERC20 } from "../../generated/RariYieldFundManager/ERC20";

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigDecimal,
  asset: string,
  vaultAddress: string
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = "deposit-" + hash.toHexString() + "-" + logIndex.toString();

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

  updateTVL(event); // also updates inputTokenBalance

  // get outputToken Supply/price
  let outputTokenInfo = updateOutputToken(vault, vaultAddress, event);
  vault.outputTokenSupply = outputTokenInfo.supply;
  vault.outputTokenPriceUSD = outputTokenInfo.priceUSD;

  // update fees/revenues/token balances
  updateYieldFees(vaultAddress);
  updateRevenues(event, vault, BIGDECIMAL_ZERO);

  // calculate pricePerShare
  let decimals = token.decimals == -1 ? DEFAULT_DECIMALS : token.decimals;
  vault.pricePerShare = vault.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(decimals))
    .div(
      vault
        .outputTokenSupply!.toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    );

  vault.save();
}

export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigDecimal,
  afterFeeUSD: BigInt, // used to calculate withdrawal fee - only used in Yield Pool
  asset: string,
  vaultAddress: string
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = "withdraw-" + hash.toHexString() + "-" + logIndex.toString();

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

  updateTVL(event); // also updates inputTokenBalance

  // calculate withdrawal fee
  let withdrawalFee = BIGDECIMAL_ZERO;
  if (vaultAddress == YIELD_VAULT_ADDRESS) {
    withdrawalFee = amountUSD.minus(
      afterFeeUSD.toBigDecimal().div(exponentToBigDecimal(DEFAULT_DECIMALS))
    );
    if (withdrawalFee.lt(BIGDECIMAL_ZERO)) {
      withdrawalFee = BIGDECIMAL_ZERO;
    }
  }

  // get outputToken Supply/price
  let outputTokenInfo = updateOutputToken(vault, vaultAddress, event);
  vault.outputTokenSupply = outputTokenInfo.supply;
  vault.outputTokenPriceUSD = outputTokenInfo.priceUSD;

  // update fees/revenues/token balances
  updateYieldFees(vaultAddress);
  updateRevenues(event, vault, withdrawalFee);

  // calculate pricePerShare
  let decimals = token.decimals == -1 ? DEFAULT_DECIMALS : token.decimals;
  vault.pricePerShare = vault.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(decimals))
    .div(
      vault
        .outputTokenSupply!.toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS))
    );

  vault.save();
}

/////////////////////////
//// Updates Helpers ////
/////////////////////////

// updates yield fees if necessary
export function updateYieldFees(vaultAddress: string): void {
  let perfFee: VaultFee = getOrCreateVaultFee(
    VaultFeeType.PERFORMANCE_FEE,
    vaultAddress
  );
  let tryWithdrawalFee: ethereum.CallResult<BigInt>;
  let tryPerfFee: ethereum.CallResult<BigInt>;

  if (vaultAddress == YIELD_VAULT_ADDRESS) {
    // get fees
    let contract = RariYieldFundManager.bind(
      Address.fromString(YIELD_VAULT_MANAGER_ADDRESS)
    );
    let withdrawalFee = getOrCreateVaultFee(
      VaultFeeType.WITHDRAWAL_FEE,
      vaultAddress
    );
    tryWithdrawalFee = contract.try_getWithdrawalFeeRate();
    tryPerfFee = contract.try_getInterestFeeRate();

    if (!tryWithdrawalFee.reverted) {
      // only update fee if it was not reverted
      withdrawalFee.feePercentage = tryWithdrawalFee.value
        .toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2)); // this fee has mantissa factor 18 set on contract-level
      withdrawalFee.save();
    }
  } else if (vaultAddress == USDC_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(
      Address.fromString(USDC_VAULT_MANAGER_ADDRESS)
    );
    tryPerfFee = contract.try_getInterestFeeRate();
  } else if (vaultAddress == DAI_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(
      Address.fromString(DAI_VAULT_MANAGER_ADDRESS)
    );
    tryPerfFee = contract.try_getInterestFeeRate();
  } else {
    let contract = RariEtherFundManager.bind(
      Address.fromString(ETHER_VAULT_MANAGER_ADDRESS)
    );
    tryPerfFee = contract.try_getInterestFeeRate();
  }

  if (!tryPerfFee.reverted) {
    // only update fee if it was not reverted
    perfFee.feePercentage = tryPerfFee.value
      .toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS - 2));
    perfFee.save();
  }
}

// updates revenues (excludes withdrawal fees)
// extraFees are withdrawal fees in Yield pool
export function updateRevenues(
  event: ethereum.Event,
  vault: Vault,
  extraFee: BigDecimal
): void {
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateYieldAggregator();
  let vaultInterest = getOrCreateVaultInterest(
    vault._vaultInterest,
    event.block.number
  );

  // get raw interest accrued based on vault address
  let tryTotalInterest: ethereum.CallResult<BigInt>;
  if (vault._vaultInterest == YIELD_VAULT_ADDRESS) {
    let contract = RariYieldFundManager.bind(
      Address.fromString(YIELD_VAULT_MANAGER_ADDRESS)
    );
    tryTotalInterest = contract.try_getInterestAccrued();
  } else if (vault._vaultInterest == USDC_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(
      Address.fromString(USDC_VAULT_MANAGER_ADDRESS)
    );
    tryTotalInterest = contract.try_getInterestAccrued();
  } else if (vault._vaultInterest == DAI_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(
      Address.fromString(DAI_VAULT_MANAGER_ADDRESS)
    );
    tryTotalInterest = contract.try_getInterestAccrued();
  } else {
    let contract = RariEtherFundManager.bind(
      Address.fromString(ETHER_VAULT_MANAGER_ADDRESS)
    );
    tryTotalInterest = contract.try_getInterestAccrued();
  }

  if (!tryTotalInterest.reverted) {
    let prevInterest = vaultInterest.interestAccruedUSD;
    let updatedInterest = tryTotalInterest.value
      .toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS));
    if (prevInterest.gt(updatedInterest)) {
      // do not calculate fees b/c old interest is greater than current
      // this means net deposits and interests are out of whack
      // ie, someone just deposited or withdrew a large amount of $$
      log.warning(
        "updateRevenues() not updated because no new interest for vault {}",
        [vaultInterest.id]
      );
    } else {
      // set new interest in vaultInterest
      vaultInterest.interestAccruedUSD = updatedInterest;
      vaultInterest.lastBlockNumber = event.block.number;
      vaultInterest.save();

      let newTotalInterest = updatedInterest.minus(prevInterest);
      let performanceFee = getOrCreateVaultFee(
        VaultFeeType.PERFORMANCE_FEE,
        vault._vaultInterest
      ).feePercentage!.div(exponentToBigDecimal(INT_TWO));
      let newFees = newTotalInterest.times(performanceFee);
      let newInterest = newTotalInterest.times(
        BIGDECIMAL_ONE.minus(performanceFee)
      );

      // add new interests
      financialMetrics.dailyTotalRevenueUSD =
        financialMetrics.dailyTotalRevenueUSD.plus(newTotalInterest);
      financialMetrics.dailyProtocolSideRevenueUSD =
        financialMetrics.dailyProtocolSideRevenueUSD.plus(newFees);
      financialMetrics.dailySupplySideRevenueUSD =
        financialMetrics.dailySupplySideRevenueUSD.plus(newInterest);
      protocol.cumulativeTotalRevenueUSD =
        protocol.cumulativeTotalRevenueUSD.plus(newTotalInterest);
      protocol.cumulativeProtocolSideRevenueUSD =
        protocol.cumulativeProtocolSideRevenueUSD.plus(newFees);
      protocol.cumulativeSupplySideRevenueUSD =
        protocol.cumulativeSupplySideRevenueUSD.plus(newInterest);
    }
  }

  // add on extra fees (ie, withdrawal fees)
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(extraFee);
  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(extraFee);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(extraFee);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(extraFee);

  vault.save();
  protocol.save();
  financialMetrics.save();
}

// as a side effect inputTokenBalance is updated
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
    let tryTokenBalance: ethereum.CallResult<BigInt>;
    if (vaultAddress == YIELD_VAULT_ADDRESS) {
      let contract = RariYieldFundManager.bind(
        Address.fromString(YIELD_VAULT_MANAGER_ADDRESS)
      );
      tryTokenBalance = contract.try_getRawFundBalance1(inputToken.symbol);
    } else if (vaultAddress == USDC_VAULT_ADDRESS) {
      let contract = RariStableFundManager.bind(
        Address.fromString(USDC_VAULT_MANAGER_ADDRESS)
      );
      tryTokenBalance = contract.try_getRawFundBalance1(inputToken.symbol);
    } else if (vaultAddress == DAI_VAULT_ADDRESS) {
      let contract = RariStableFundManager.bind(
        Address.fromString(DAI_VAULT_MANAGER_ADDRESS)
      );
      tryTokenBalance = contract.try_getRawFundBalance1(inputToken.symbol);
    } else {
      let contract = RariEtherFundManager.bind(
        Address.fromString(ETHER_VAULT_MANAGER_ADDRESS)
      );
      tryTokenBalance = contract.try_getRawFundBalance(); // in ETH
    }

    vault.inputTokenBalance = tryTokenBalance.reverted
      ? vault.inputTokenBalance
      : tryTokenBalance.value;
    vault.totalValueLockedUSD = getUsdPrice(
      Address.fromString(inputToken.id),
      vault.inputTokenBalance
        .toBigDecimal()
        .div(exponentToBigDecimal(inputToken.decimals))
    );

    totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
    vault.save();
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

// custom class to pass output token values back to calling function
export class OutputTokenValues {
  supply: BigInt;
  priceUSD: BigDecimal;
  constructor(supply: BigInt, priceUSD: BigDecimal) {
    this.supply = supply;
    this.priceUSD = priceUSD;
  }
}

// returns output token price in USD
export function updateOutputToken(
  vault: Vault,
  vaultContract: string,
  event: ethereum.Event
): OutputTokenValues {
  // OutputTokenPrice = getFundBalance() / outputTokenSupply
  // Here: https://docs.rari.capital/yag/#usage

  // get and update outputTokenSupply
  let outputTokenContract = ERC20.bind(Address.fromString(vault.outputToken!));
  let tryTotalSupply = outputTokenContract.try_totalSupply();
  let outputTokenSupply = tryTotalSupply.reverted
    ? vault.outputTokenSupply
    : tryTotalSupply.value;

  // convert supply to BD
  let outputToken = getOrCreateToken(vault.outputToken!);
  let outputTokenSupplyBD = outputTokenSupply!
    .toBigDecimal()
    .div(exponentToBigDecimal(outputToken.decimals));

  // calculate outputTokenPrice
  let outputTokenPrice = BIGDECIMAL_ZERO;
  if (vaultContract == YIELD_VAULT_ADDRESS) {
    let contract = RariYieldFundManager.bind(
      Address.fromString(YIELD_VAULT_MANAGER_ADDRESS)
    );
    let tryBalance = contract.try_getFundBalance();
    outputTokenPrice = tryBalance.reverted
      ? BIGDECIMAL_ZERO
      : tryBalance.value
          .toBigDecimal()
          .div(exponentToBigDecimal(DEFAULT_DECIMALS))
          .div(outputTokenSupplyBD);
  } else if (vaultContract == USDC_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(
      Address.fromString(USDC_VAULT_MANAGER_ADDRESS)
    );
    let tryBalance = contract.try_getFundBalance();
    outputTokenPrice = tryBalance.reverted
      ? BIGDECIMAL_ZERO
      : tryBalance.value
          .toBigDecimal()
          .div(exponentToBigDecimal(DEFAULT_DECIMALS))
          .div(outputTokenSupplyBD);
  } else if (vaultContract == DAI_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(
      Address.fromString(DAI_VAULT_MANAGER_ADDRESS)
    );
    let tryBalance = contract.try_getFundBalance();
    outputTokenPrice = tryBalance.reverted
      ? BIGDECIMAL_ZERO
      : tryBalance.value
          .toBigDecimal()
          .div(exponentToBigDecimal(DEFAULT_DECIMALS))
          .div(outputTokenSupplyBD);
  } else {
    // must be Ether vault
    let contract = RariEtherFundManager.bind(
      Address.fromString(ETHER_VAULT_MANAGER_ADDRESS)
    );
    let tryBalance = contract.try_getFundBalance();
    let balanceUSD = tryBalance.reverted
      ? BIGDECIMAL_ZERO
      : getUsdPrice(
          Address.fromString(ETH_ADDRESS),
          tryBalance.value
            .toBigDecimal()
            .div(exponentToBigDecimal(DEFAULT_DECIMALS))
        );
    outputTokenPrice = balanceUSD.div(outputTokenSupplyBD);
  }

  // set outputToken values to each vault
  let protocol = getOrCreateYieldAggregator();
  for (let i = 0; i < protocol._vaultList.length; i++) {
    let splitArr = protocol._vaultList[i].split("-", 2);
    let vaultAddress = splitArr[0];
    let tokenAddress = splitArr[1];

    if (vaultAddress.toLowerCase() == vaultContract.toLowerCase()) {
      let _vault = getOrCreateVault(event, vaultAddress, tokenAddress);
      _vault.outputTokenSupply = outputTokenSupply;
      _vault.outputTokenPriceUSD = outputTokenPrice;
      _vault.save();
    }
  }

  let output = new OutputTokenValues(outputTokenSupply!, outputTokenPrice);

  return output;
}
