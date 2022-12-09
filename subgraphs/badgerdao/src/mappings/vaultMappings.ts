import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  Harvested,
  WithdrawCall,
  WithdrawalFee,
  DepositForCall,
  WithdrawAllCall,
  TreeDistribution,
  PerformanceFeeGovernance,
  PerformanceFeeStrategist,
  Deposit1Call as DepositCall,
  DepositAll1Call as DepositAllCall,
  DepositCall as DepositCallWithProof,
  DepositAllCall as DepositAllCallWithProof,
  DepositFor1Call as DepositForCallWithProof,
} from "../../generated/templates/Strategy/Vault";
import { Deposit } from "../modules/Deposit";
import { log } from "@graphprotocol/graph-ts";
import { Withdraw } from "../modules/Withdraw";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { getOrCreateToken, getOrCreateVault } from "../common/initializers";

export function handlePerformanceFeeGovernance(
  event: PerformanceFeeGovernance
): void {
  const vaultAddress = event.address;
  const tokenAddress = event.params.token;
  const performanceFeeAmount = event.params.amount;

  if (performanceFeeAmount.equals(constants.BIGINT_ZERO)) return;

  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantToken = getOrCreateToken(tokenAddress, event.block);
  const wantTokenDecimals = constants.BIGINT_TEN.pow(
    wantToken.decimals as u8
  ).toBigDecimal();

  const protocolSideRevenueUSD = performanceFeeAmount
    .divDecimal(wantTokenDecimals)
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[Vault:PerformanceFeeGovernance] Vault: {}, wantToken: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      tokenAddress.toHexString(),
      performanceFeeAmount.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handlePerformanceFeeStrategist(
  event: PerformanceFeeStrategist
): void {
  const vaultAddress = event.address;
  const tokenAddress = event.params.token;
  const performanceFeeAmount = event.params.amount;

  if (performanceFeeAmount.equals(constants.BIGINT_ZERO)) return;

  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantToken = getOrCreateToken(tokenAddress, event.block);
  const wantTokenDecimals = constants.BIGINT_TEN.pow(
    wantToken.decimals as u8
  ).toBigDecimal();

  const protocolSideRevenueUSD = performanceFeeAmount
    .divDecimal(wantTokenDecimals)
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[Vault:PerformanceFeeStrategist] Vault: {}, token: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      tokenAddress.toHexString(),
      performanceFeeAmount.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleTreeDistribution(event: TreeDistribution): void {
  const vaultAddress = event.address;
  const rewardTokenAddress = event.params.token;
  const rewardTokenEmissionAmount = event.params.amount;

  const vault = getOrCreateVault(vaultAddress, event.block);

  const rewardToken = getOrCreateToken(rewardTokenAddress, event.block);
  const rewardTokenDecimals = constants.BIGINT_TEN.pow(
    rewardToken.decimals as u8
  ).toBigDecimal();

  const supplySideRevenueUSD = rewardTokenEmissionAmount
    .divDecimal(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning(
    "[Vault:TreeDistribution] Vault: {}, rewardTokenAddress: {}, Amount: {}, supplySideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      rewardTokenAddress.toHexString(),
      rewardTokenEmissionAmount.toString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleWithdrawalFee(event: WithdrawalFee): void {
  const vaultAddress = event.address;
  const wantTokenAddress = event.params.token;
  const withdrawalFeeAmount = event.params.amount;

  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantToken = getOrCreateToken(wantTokenAddress, event.block);
  const wantTokenDecimals = constants.BIGINT_TEN.pow(
    wantToken.decimals as u8
  ).toBigDecimal();

  const protocolSideRevenueUSD = withdrawalFeeAmount
    .divDecimal(wantTokenDecimals)
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[Vault: WithdrawalFee] Vault: {}, token: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      wantTokenAddress.toHexString(),
      withdrawalFeeAmount.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleHarvested(event: Harvested): void {
  const harvestedAmount = event.params.amount;
  const harvestTokenAddress = event.params.token;

  if (harvestedAmount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = event.address;
  const vault = getOrCreateVault(vaultAddress, event.block);

  const harvestedToken = getOrCreateToken(harvestTokenAddress, event.block);
  const harvestedTokenDecimals = constants.BIGINT_TEN.pow(
    harvestedToken.decimals as u8
  ).toBigDecimal();

  const supplySideRevenueUSD = harvestedAmount
    .divDecimal(harvestedTokenDecimals)
    .times(harvestedToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning(
    "[Vault: Harvested] Vault: {}, token: {}, amount: {}, amountUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      harvestTokenAddress.toHexString(),
      harvestedAmount.toString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleDeposit(call: DepositCall): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;

  Deposit(
    vaultAddress,
    depositAmount,
    call.transaction.from,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositWithProof(call: DepositCallWithProof): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;

  Deposit(
    vaultAddress,
    depositAmount,
    call.transaction.from,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositFor(call: DepositForCall): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;
  const recipientAddress = call.inputs._recipient;

  Deposit(
    vaultAddress,
    depositAmount,
    recipientAddress,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositForWithProof(call: DepositForCallWithProof): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;
  const recipientAddress = call.inputs._recipient;

  Deposit(
    vaultAddress,
    depositAmount,
    recipientAddress,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositAll(call: DepositAllCall): void {
  const vaultAddress = call.to;
  const depositAmount = constants.BIGINT_NEGATIVE_ONE;

  Deposit(
    vaultAddress,
    depositAmount,
    call.transaction.from,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositAllWithProof(call: DepositAllCallWithProof): void {
  const vaultAddress = call.to;
  const depositAmount = constants.BIGINT_NEGATIVE_ONE;

  Deposit(
    vaultAddress,
    depositAmount,
    call.transaction.from,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdraw(call: WithdrawCall): void {
  const vaultAddress = call.to;
  const sharesBurnt = call.inputs._shares;

  Withdraw(vaultAddress, sharesBurnt, call.transaction, call.block);

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdrawAll(call: WithdrawAllCall): void {
  const vaultAddress = call.to;
  const sharesBurnt = constants.BIGINT_NEGATIVE_ONE;

  Withdraw(vaultAddress, sharesBurnt, call.transaction, call.block);

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}
