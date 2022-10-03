import {
  SetWithdrawalFee,
  SetPerformanceFeeGovernance,
  SetPerformanceFeeStrategist,
} from "../../generated/templates/Strategy/Vault";
import {
  Harvest,
  FarmHarvest,
  HarvestState,
  CurveHarvest,
  TreeDistribution,
  PerformanceFeeStrategist,
  PerformanceFeeGovernance,
} from "../../generated/templates/Strategy/Strategy";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { getOrCreateToken, getOrCreateVault } from "../common/initializers";
import { Strategy as StrategyContract } from "../../generated/templates/Strategy/Strategy";

export function handleHarvest(event: Harvest): void {
  const strategyAddress = event.address;
  const harvestedAmount = event.params.harvested;

  if (harvestedAmount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const strategyContract = StrategyContract.bind(strategyAddress);
  const wantTokenAddress = utils.readValue<Address>(
    strategyContract.try_want(),
    constants.NULL.TYPE_ADDRESS
  );

  const wantToken = getOrCreateToken(wantTokenAddress, event.block);

  const supplySideRevenueUSD = harvestedAmount
    .divDecimal(
      constants.BIGINT_TEN.pow(wantToken.decimals as u8).toBigDecimal()
    )
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning(
    "[Harvest] Vault: {}, Strategy: {}, token: {}, amount: {}, amountUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      wantTokenAddress.toHexString(),
      harvestedAmount.toString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleFarmHarvest(event: FarmHarvest): void {
  const strategyAddress = event.address;
  const rewardTokenEmissionAmount = event.params.farmToRewards;
  const feesToStrategist = event.params.strategistPerformanceFee;
  const feesToGovernance = event.params.governancePerformanceFee;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const strategyContract = StrategyContract.bind(strategyAddress);

  const rewardTokenAddress = utils.readValue<Address>(
    strategyContract.try_farm(),
    constants.NULL.TYPE_ADDRESS
  );
  const rewardToken = getOrCreateToken(rewardTokenAddress, event.block);

  const protocolSideRevenueUSD = feesToStrategist
    .plus(feesToGovernance)
    .divDecimal(
      constants.BIGINT_TEN.pow(rewardToken.decimals as u8).toBigDecimal()
    )
    .times(rewardToken.lastPriceUSD!);

  const supplySideRevenueUSD = rewardTokenEmissionAmount
    .divDecimal(
      constants.BIGINT_TEN.pow(rewardToken.decimals as u8).toBigDecimal()
    )
    .times(rewardToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[FarmHarvest] Vault: {}, Strategy: {}, supplySideRevenueUSD: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      supplySideRevenueUSD.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleHarvestState(event: HarvestState): void {
  const strategyAddress = event.address;
  const feesToStrategist = event.params.toStrategist;
  const feesToGovernance = event.params.toGovernance;
  const rewardTokenEmissionAmount = event.params.toBadgerTree;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const strategyContract = StrategyContract.bind(strategyAddress);
  const rewardTokenAddress = utils.readValue<Address>(
    strategyContract.try_xsushi(),
    constants.NULL.TYPE_ADDRESS
  );
  const rewardToken = getOrCreateToken(rewardTokenAddress, event.block);

  const protocolSideRevenueUSD = feesToStrategist
    .plus(feesToGovernance)
    .divDecimal(
      constants.BIGINT_TEN.pow(rewardToken.decimals as u8).toBigDecimal()
    )
    .times(rewardToken.lastPriceUSD!);

  const supplySideRevenueUSD = rewardTokenEmissionAmount
    .divDecimal(
      constants.BIGINT_TEN.pow(rewardToken.decimals as u8).toBigDecimal()
    )
    .times(rewardToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[HarvestState] Vault: {}, Strategy: {}, supplySideRevenueUSD: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      supplySideRevenueUSD.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleCurveHarvest(event: CurveHarvest): void {
  const strategyAddress = event.address;
  const feesToStrategist = event.params.strategistPerformanceFee;
  const feesToGovernance = event.params.governancePerformanceFee;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const strategyContract = StrategyContract.bind(strategyAddress);
  const wantTokenAddress = utils.readValue<Address>(
    strategyContract.try_want(),
    constants.NULL.TYPE_ADDRESS
  );
  const wantToken = getOrCreateToken(wantTokenAddress, event.block);

  const protocolSideRevenueUSD = feesToStrategist
    .plus(feesToGovernance)
    .divDecimal(
      constants.BIGINT_TEN.pow(wantToken.decimals as u8).toBigDecimal()
    )
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[CurveHarvest] Vault: {}, Strategy: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleSetWithdrawalFee(event: SetWithdrawalFee): void {
  const strategyAddress = event.address;
  const vaultAddress = utils.getVaultAddressFromContext();

  let withdrawalFees = utils.getVaultWithdrawalFees(
    vaultAddress,
    strategyAddress
  );

  log.warning(
    "[SetWithdrawalFee] Vault: {}, Strategy: {}, withdrawalFees: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      withdrawalFees.feePercentage!.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handlePerformanceFeeGovernance(
  event: PerformanceFeeGovernance
): void {
  const amount = event.params.amount;
  const tokenAddress = event.params.token;

  if (amount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantToken = getOrCreateToken(tokenAddress, event.block);
  const protocolSideRevenueUSD = amount
    .divDecimal(
      constants.BIGINT_TEN.pow(wantToken.decimals as u8).toBigDecimal()
    )
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[Strategy:PerformanceFeeGovernance] Vault: {}, wantToken: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      tokenAddress.toHexString(),
      amount.toHexString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleSetPerformanceFeeGovernance(
  event: SetPerformanceFeeGovernance
): void {
  const strategyAddress = event.address;
  const vaultAddress = utils.getVaultAddressFromContext();

  let performanceFees = utils.getVaultPerformanceFees(
    vaultAddress,
    strategyAddress
  );

  log.warning(
    "[SetPerformanceFeeGovernance] Vault: {}, Strategy: {}, withdrawalFees: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      performanceFees.feePercentage!.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handlePerformanceFeeStrategist(
  event: PerformanceFeeStrategist
): void {
  const amount = event.params.amount;
  const tokenAddress = event.params.token;

  if (amount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantToken = getOrCreateToken(tokenAddress, event.block);
  const protocolSideRevenueUSD = amount
    .divDecimal(
      constants.BIGINT_TEN.pow(wantToken.decimals as u8).toBigDecimal()
    )
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[Strategy:PerformanceFeeStrategist] Vault: {}, token: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      tokenAddress.toHexString(),
      amount.toHexString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleSetPerformanceFeeStrategist(
  event: SetPerformanceFeeStrategist
): void {
  const strategyAddress = event.address;
  const vaultAddress = utils.getVaultAddressFromContext();

  let performanceFees = utils.getVaultPerformanceFees(
    vaultAddress,
    strategyAddress
  );

  log.warning(
    "[SetPerformanceFeeStrategist] Vault: {}, Strategy: {}, withdrawalFees: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      performanceFees.feePercentage!.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleTreeDistribution(event: TreeDistribution): void {
  const strategyAddress = event.address;
  const timestamp = event.params.timestamp;
  const rewardAmount = event.params.amount;
  const rewardTokenAddress = event.params.token;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const rewardToken = getOrCreateToken(rewardTokenAddress, event.block);

  const supplySideRevenueUSD = rewardAmount
    .divDecimal(
      constants.BIGINT_TEN.pow(rewardToken.decimals as u8).toBigDecimal()
    )
    .times(rewardToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning(
    "[TreeDistribution] Vault: {}, Strategy: {}, supplySideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
