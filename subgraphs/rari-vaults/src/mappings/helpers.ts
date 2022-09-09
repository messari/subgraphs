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
  BIGINT_ZERO,
  DAI_VAULT_ADDRESS,
  DAI_VAULT_MANAGER_ADDRESS,
  DEFAULT_DECIMALS,
  ETHER_VAULT_MANAGER_ADDRESS,
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
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultFee,
  getOrCreateVaultHourlySnapshot,
  getOrCreateVaultInterest,
  getOrCreateYieldAggregator,
} from "../common/getters";
import { exponentToBigDecimal } from "../common/utils/utils";
import { RariYieldFundManager } from "../../generated/RariYieldFundManager/RariYieldFundManager";
import { RariStableFundManager } from "../../generated/RariUSDCFundManager/RariStableFundManager";
import { RariEtherFundManager } from "../../generated/RariEtherFundManager/RariEtherFundManager";
import { getUsdPricePerToken } from "../prices";
import { ERC20 } from "../../generated/RariYieldFundManager/ERC20";

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  asset: string,
  vaultAddress: string
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = "deposit-" + hash.toHexString() + "-" + logIndex.toString();

  updateTVL(event); // also updates inputTokenBalance and prices

  // create Deposit
  let deposit = new Deposit(id);

  // get (or create) asset
  let token = getOrCreateToken(asset);
  let vault = getOrCreateVault(event, vaultAddress, token.id);
  deposit.vault = vault.id;
  let customPrice = getUsdPricePerToken(Address.fromString(asset));
  let assetPriceUSD = customPrice.usdPrice.div(customPrice.decimalsBaseTen);
  token.lastPriceUSD = assetPriceUSD;
  token.lastPriceBlockNumber = event.block.number;
  token.save();

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
  deposit.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(token.decimals))
    .times(assetPriceUSD);

  deposit.save();

  // get outputToken Supply/price
  let outputTokenInfo = updateOutputToken(vault, vaultAddress, event);
  vault.outputTokenSupply = outputTokenInfo.supply;
  vault.outputTokenPriceUSD = outputTokenInfo.priceUSD;
  vault.save();

  // update fees/revenues/token balances
  updateYieldFees(vaultAddress);
  updateRevenues(event, vault, BIGDECIMAL_ZERO);

  // calculate pricePerShare
  // pricePerShare = (inputTokenBalance / outputTokenSupply)
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
  feeAmount: BigInt, // used to calculate withdrawal fee
  asset: string,
  vaultAddress: string
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = "withdraw-" + hash.toHexString() + "-" + logIndex.toString();

  updateTVL(event); // also updates inputTokenBalance and prices

  // create Deposit
  let withdraw = new Withdraw(id);

  // get (or create) token
  let token = getOrCreateToken(asset);
  let vault = getOrCreateVault(event, vaultAddress, token.id);
  withdraw.vault = vault.id;
  let customPrice = getUsdPricePerToken(Address.fromString(asset));
  let assetPriceUSD = customPrice.usdPrice.div(customPrice.decimalsBaseTen);
  token.lastPriceUSD = assetPriceUSD;
  token.lastPriceBlockNumber = event.block.number;
  token.save();

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
  withdraw.amountUSD = amount
    .toBigDecimal()
    .div(exponentToBigDecimal(token.decimals))
    .times(assetPriceUSD);

  withdraw.save();

  // get outputToken Supply/price
  let outputTokenInfo = updateOutputToken(vault, vaultAddress, event);
  vault.outputTokenSupply = outputTokenInfo.supply;
  vault.outputTokenPriceUSD = outputTokenInfo.priceUSD;
  vault.save();

  // calculate withdrawal fee amount in USD
  let withdrawalFeeUSD = BIGDECIMAL_ZERO;
  if (feeAmount.gt(BIGINT_ZERO)) {
    withdrawalFeeUSD = feeAmount
      .toBigDecimal()
      .div(exponentToBigDecimal(token.decimals))
      .times(assetPriceUSD);
  }

  // update fees/revenues/token balances
  updateYieldFees(vaultAddress);
  updateRevenues(event, vault, withdrawalFeeUSD);

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

// updates revenues
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

  // setup revenues
  let newSupplyRevenueUSD = BIGDECIMAL_ZERO;
  let newProtooclRevenueUSD = extraFee;
  let newTotalRevenueUSD = extraFee;

  // get raw interest accrued based on vault address
  let tryTotalInterest: ethereum.CallResult<BigInt>;
  if (vault._vaultInterest == YIELD_VAULT_ADDRESS) {
    let contract = RariYieldFundManager.bind(
      Address.fromString(YIELD_VAULT_MANAGER_ADDRESS)
    );
    tryTotalInterest = contract.try_getInterestFeesGenerated();
  } else if (vault._vaultInterest == USDC_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(
      Address.fromString(USDC_VAULT_MANAGER_ADDRESS)
    );
    tryTotalInterest = contract.try_getInterestFeesGenerated();
  } else if (vault._vaultInterest == DAI_VAULT_ADDRESS) {
    let contract = RariStableFundManager.bind(
      Address.fromString(DAI_VAULT_MANAGER_ADDRESS)
    );
    tryTotalInterest = contract.try_getInterestFeesGenerated();
  } else {
    let contract = RariEtherFundManager.bind(
      Address.fromString(ETHER_VAULT_MANAGER_ADDRESS)
    );
    tryTotalInterest = contract.try_getInterestFeesGenerated();
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

      // calculate new interests
      newSupplyRevenueUSD = newSupplyRevenueUSD.plus(newInterest);
      newProtooclRevenueUSD = newProtooclRevenueUSD.plus(newFees);
      newTotalRevenueUSD = newTotalRevenueUSD.plus(newTotalInterest);
    }
  }

  // update vault revenues
  vault.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD.plus(newSupplyRevenueUSD);
  vault.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD.plus(newProtooclRevenueUSD);
  vault.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);

  // update total revenues
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(newSupplyRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(newProtooclRevenueUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);

  // update financial revenues
  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailySupplySideRevenueUSD.plus(newSupplyRevenueUSD);
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(newProtooclRevenueUSD);
  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);

  // update daily snapshot revenues
  let dailySnapshot = getOrCreateVaultDailySnapshot(event, vault.id);
  dailySnapshot.dailyProtocolSideRevenueUSD =
    dailySnapshot.dailyProtocolSideRevenueUSD.plus(newProtooclRevenueUSD);
  dailySnapshot.dailySupplySideRevenueUSD =
    dailySnapshot.dailySupplySideRevenueUSD.plus(newSupplyRevenueUSD);
  dailySnapshot.dailyTotalRevenueUSD =
    dailySnapshot.dailyTotalRevenueUSD.plus(newTotalRevenueUSD);
  dailySnapshot.save();

  // update hourly snapshot revenues
  let hourlySnapshot = getOrCreateVaultHourlySnapshot(event, vault.id);
  hourlySnapshot.cumulativeProtocolSideRevenueUSD =
    hourlySnapshot.cumulativeProtocolSideRevenueUSD.plus(newProtooclRevenueUSD);
  hourlySnapshot.cumulativeSupplySideRevenueUSD =
    hourlySnapshot.cumulativeSupplySideRevenueUSD.plus(newSupplyRevenueUSD);
  hourlySnapshot.cumulativeTotalRevenueUSD =
    hourlySnapshot.cumulativeTotalRevenueUSD.plus(newTotalRevenueUSD);
  hourlySnapshot.save();

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

    // Get TVL from rari vaults on a per token basis
    // Rari vaults can have multiple inputTokens and can store multiple tokens
    // And the only way to get individual token balances is to use getRawFundBalance()
    // This function returns the amount with "unclaimed fees"

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

    // update input token price
    let customPrice = getUsdPricePerToken(Address.fromString(inputToken.id));
    inputToken.lastPriceUSD = customPrice.usdPrice.div(
      customPrice.decimalsBaseTen
    );
    inputToken.lastPriceBlockNumber = event.block.number;
    inputToken.save();

    vault.inputTokenBalance = tryTokenBalance.reverted
      ? vault.inputTokenBalance
      : tryTokenBalance.value;
    vault.totalValueLockedUSD = inputToken.lastPriceUSD!.times(
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
  // OutputTokenPrice = (TVL of all tokens in vault) / outputTokenSupply
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

  // set outputToken values to each vault / add up TVLs
  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  let protocol = getOrCreateYieldAggregator();
  for (let i = 0; i < protocol._vaultList.length; i++) {
    let splitArr = protocol._vaultList[i].split("-", 2);
    let vaultAddress = splitArr[0];
    let tokenAddress = splitArr[1];

    if (vaultAddress.toLowerCase() == vaultContract.toLowerCase()) {
      let _vault = getOrCreateVault(event, vaultAddress, tokenAddress);
      _vault.outputTokenSupply = outputTokenSupply;
      totalValueLockedUSD = totalValueLockedUSD.plus(
        _vault.totalValueLockedUSD
      );
      _vault.save();
    }
  }

  // calculate outputTokenPrice = TVL / outputTokenSupplyBD
  let outputTokenPriceUSD = outputTokenSupplyBD.equals(BIGDECIMAL_ZERO)
    ? BIGDECIMAL_ZERO
    : totalValueLockedUSD.div(outputTokenSupplyBD);

  // set outputTokenPrice
  for (let i = 0; i < protocol._vaultList.length; i++) {
    let splitArr = protocol._vaultList[i].split("-", 2);
    let vaultAddress = splitArr[0];
    let tokenAddress = splitArr[1];

    if (vaultAddress.toLowerCase() == vaultContract.toLowerCase()) {
      let _vault = getOrCreateVault(event, vaultAddress, tokenAddress);
      _vault.outputTokenPriceUSD = outputTokenPriceUSD;
      _vault.save();
    }
  }

  let output = new OutputTokenValues(outputTokenSupply!, outputTokenPriceUSD);

  return output;
}
