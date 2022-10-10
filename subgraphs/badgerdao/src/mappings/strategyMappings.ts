import {
  SetWithdrawalFee,
  SetPerformanceFeeGovernance,
  SetPerformanceFeeStrategist,
} from "../../generated/templates/Strategy/Vault";
import {
  Harvest,
  FarmHarvest,
  HarvestState,
  TreeDistribution,
  PerformanceFeeStrategist,
  PerformanceFeeGovernance,
  HarvestState1 as DiggHarvestState,
} from "../../generated/templates/Strategy/Strategy";
import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { updateRewardTokenInfo } from "../modules/Rewards";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { getOrCreateToken, getOrCreateVault } from "../common/initializers";

export function handleHarvest(event: Harvest): void {
  const strategyAddress = event.address;
  const harvestedAmount = event.params.harvested;

  if (harvestedAmount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  let wantToken = utils.getStrategyWantToken(strategyAddress, event.block);
  let wantTokenDecimals = constants.BIGINT_TEN.pow(
    wantToken.decimals as u8
  ).toBigDecimal();

  const supplySideRevenueUSD = harvestedAmount
    .divDecimal(wantTokenDecimals)
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
      wantToken.id,
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

  let rewardToken = utils.getStrategyFarmToken(strategyAddress, event.block);
  let rewardTokenDecimals = constants.BIGINT_TEN.pow(
    rewardToken.decimals as u8
  ).toBigDecimal();

  const supplySideRevenueUSD = rewardTokenEmissionAmount
    .divDecimal(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  const protocolSideRevenueUSD = feesToStrategist
    .plus(feesToGovernance)
    .divDecimal(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    event.block
  );

  updateRewardTokenInfo(
    vaultAddress,
    rewardToken,
    rewardTokenEmissionAmount,
    event.params.blockNumber,
    event.params.timestamp,
    event.block
  );

  log.warning(
    "[FarmHarvest] Vault: {}, Strategy: {}, FarmToken: {}, supplySideRevenueUSD: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      rewardToken.id,
      supplySideRevenueUSD.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleDiggHarvest(event: DiggHarvestState): void {
  const strategyAddress = event.address;
  const harvestedAmount = event.params.diggIncrease;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  let rewardToken = getOrCreateToken(constants.DIGG_TOKEN_ADDRESS, event.block);
  let rewardTokenDecimals = constants.BIGINT_TEN.pow(
    rewardToken.decimals as u8
  ).toBigDecimal();

  const supplySideRevenueUSD = harvestedAmount
    .divDecimal(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning(
    "[DiggHarvestState] Vault: {}, Strategy: {}, FarmToken: {}, supplySideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      rewardToken.id,
      supplySideRevenueUSD.toString(),
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

  let rewardToken = utils.getStrategyXSushiToken(strategyAddress, event.block);
  let rewardTokenDecimals = constants.BIGINT_TEN.pow(
    rewardToken.decimals as u8
  ).toBigDecimal();

  const supplySideRevenueUSD = rewardTokenEmissionAmount
    .divDecimal(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  const protocolSideRevenueUSD = feesToStrategist
    .plus(feesToGovernance)
    .divDecimal(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    event.block
  );

  updateRewardTokenInfo(
    vaultAddress,
    rewardToken,
    rewardTokenEmissionAmount,
    event.params.blockNumber,
    event.params.timestamp,
    event.block
  );

  log.warning(
    "[HarvestState] Vault: {}, Strategy: {}, XSushiToken: {}, supplySideRevenueUSD: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      rewardToken.id,
      supplySideRevenueUSD.toString(),
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
  const tokenAddress = event.params.token;
  const performanceFeeAmount = event.params.amount;

  if (performanceFeeAmount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  let wantToken = getOrCreateToken(tokenAddress, event.block);
  let wantTokenDecimals = constants.BIGINT_TEN.pow(
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
    "[Strategy:PerformanceFeeGovernance] Vault: {}, wantToken: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      tokenAddress.toHexString(),
      performanceFeeAmount.toString(),
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
  const tokenAddress = event.params.token;
  const performanceFeeAmount = event.params.amount;

  if (performanceFeeAmount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  let wantToken = getOrCreateToken(tokenAddress, event.block);
  let wantTokenDecimals = constants.BIGINT_TEN.pow(
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
    "[Strategy:PerformanceFeeStrategist] Vault: {}, token: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      tokenAddress.toHexString(),
      performanceFeeAmount.toString(),
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
  const rewardTokenAddress = event.params.token;
  const rewardTokenEmissionAmount = event.params.amount;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  let rewardToken = getOrCreateToken(rewardTokenAddress, event.block);
  let rewardTokenDecimals = constants.BIGINT_TEN.pow(
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

  updateRewardTokenInfo(
    vaultAddress,
    rewardToken,
    rewardTokenEmissionAmount,
    event.params.blockNumber,
    event.params.timestamp,
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
