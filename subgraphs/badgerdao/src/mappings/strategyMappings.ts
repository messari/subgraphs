import {
  Harvest,
  FarmHarvest,
  HarvestState,
  HarvestState1,
  CurveHarvest,
  TreeDistribution,
  PerformanceFeeStrategist,
  PerformanceFeeGovernance,
} from "../../generated/templates/Strategy/Strategy";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { Address, log } from "@graphprotocol/graph-ts";
import { getOrCreateVault } from "../common/initializers";
import { getPriceOfOutputTokens } from "../modules/Prices";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { Strategy as StrategyContract } from "../../generated/templates/Strategy/Strategy";

export function handleHarvest(event: Harvest): void {
  const strategyAddress = event.address;
  const harvestedAmount = event.params.harvested;
  const strategyContract = StrategyContract.bind(strategyAddress);

  const vaultAddress = utils.getVaultAddressFromStrategy(strategyAddress);
  
  if (vaultAddress.equals(constants.BDIGG_VAULT_ADDRESS)) {
    return;
  }

  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantToken = utils.readValue<Address>(
    strategyContract.try_want(),
    constants.NULL.TYPE_ADDRESS
  );
  const wantTokenPrice = getUsdPricePerToken(wantToken);
  const wantTokenDecimals = utils.getTokenDecimals(wantToken);

  const supplySideRevenueUSD = harvestedAmount
    .toBigDecimal()
    .div(wantTokenDecimals)
    .times(wantTokenPrice.usdPrice)
    .div(wantTokenPrice.decimalsBaseTen);

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
      wantToken.toHexString(),
      harvestedAmount.toString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleDiggHarvestState(event: HarvestState1): void {
  // Emitted by `bDIGG` vault

  const strategyAddress = event.address;
  const strategyContract = StrategyContract.bind(strategyAddress);

  const vaultAddress = utils.getVaultAddressFromStrategy(strategyAddress);
  const vault = getOrCreateVault(vaultAddress, event.block);

  const harvestedAmount = event.params.diggIncrease;

  const diggTokenAddress = utils.readValue<Address>(
    strategyContract.try_want(),
    constants.NULL.TYPE_ADDRESS
  );
  const diggTokenDecimals = utils.getTokenDecimals(diggTokenAddress);

  const diggTokenPrice = getUsdPricePerToken(diggTokenAddress);
  const supplySideRevenueUSD = harvestedAmount
    .toBigDecimal()
    .div(diggTokenDecimals)
    .times(diggTokenPrice.usdPrice)
    .div(diggTokenPrice.decimalsBaseTen);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning(
    "[DiggHarvestState] Vault: {}, Strategy: {}, supplySideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleCurveHarvest(event: CurveHarvest): void {
  const feesToStrategist = event.params.strategistPerformanceFee;
  const feesToGovernance = event.params.governancePerformanceFee;

  const strategyAddress = event.address;
  const strategyContract = StrategyContract.bind(strategyAddress);

  const vaultAddress = utils.getVaultAddressFromStrategy(strategyAddress);
  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantTokenAddress = utils.readValue<Address>(
    strategyContract.try_want(),
    constants.NULL.TYPE_ADDRESS
  );
  // TODO: Calculate RewardEmissions Per Day.

  const wantTokenPrice = getUsdPricePerToken(wantTokenAddress);
  const wantTokenDecimals = utils.getTokenDecimals(wantTokenAddress);

  const protocolSideRevenueUSD = feesToStrategist
    .plus(feesToGovernance)
    .toBigDecimal()
    .div(wantTokenDecimals)
    .times(wantTokenPrice.usdPrice)
    .div(wantTokenPrice.decimalsBaseTen);

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

export function handleFarmHarvest(event: FarmHarvest): void {
  const feesToStrategist = event.params.strategistPerformanceFee;
  const feesToGovernance = event.params.governancePerformanceFee;
  const rewardTokenEmissionAmount = event.params.farmToRewards;

  const strategyAddress = event.address;
  const strategyContract = StrategyContract.bind(strategyAddress);

  const vaultAddress = utils.getVaultAddressFromStrategy(strategyAddress);
  const vault = getOrCreateVault(vaultAddress, event.block);

  const rewardTokenAddress = utils.readValue<Address>(
    strategyContract.try_farm(),
    constants.NULL.TYPE_ADDRESS
  );
  const rewardTokenDecimals = utils.getTokenDecimals(rewardTokenAddress);

  // TODO: Calculate RewardEmissions Per Day.

  const farmTokenPrice = getUsdPricePerToken(rewardTokenAddress);
  const protocolSideRevenueUSD = feesToStrategist
    .plus(feesToGovernance)
    .toBigDecimal()
    .div(rewardTokenDecimals)
    .times(farmTokenPrice.usdPrice)
    .div(farmTokenPrice.decimalsBaseTen);

  const supplySideRevenueUSD = rewardTokenEmissionAmount
    .toBigDecimal()
    .div(rewardTokenDecimals)
    .times(farmTokenPrice.usdPrice)
    .div(farmTokenPrice.decimalsBaseTen);

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
  const feesToStrategist = event.params.toStrategist;
  const feesToGovernance = event.params.toGovernance;
  const rewardTokenEmissionAmount = event.params.toBadgerTree;

  const strategyAddress = event.address;
  const strategyContract = StrategyContract.bind(strategyAddress);

  const vaultAddress = utils.getVaultAddressFromStrategy(strategyAddress);
  const vault = getOrCreateVault(vaultAddress, event.block);

  const rewardTokenAddress = utils.readValue<Address>(
    strategyContract.try_xsushi(),
    constants.NULL.TYPE_ADDRESS
  );
  const rewardTokenDecimals = utils.getTokenDecimals(rewardTokenAddress);

  // TODO: Calculate RewardEmissions Per Day.

  const xSushiTokenPrice = getUsdPricePerToken(rewardTokenAddress);
  const protocolSideRevenueUSD = feesToStrategist
    .plus(feesToGovernance)
    .toBigDecimal()
    .div(rewardTokenDecimals)
    .times(xSushiTokenPrice.usdPrice)
    .div(xSushiTokenPrice.decimalsBaseTen);

  const supplySideRevenueUSD = rewardTokenEmissionAmount
    .toBigDecimal()
    .div(rewardTokenDecimals)
    .times(xSushiTokenPrice.usdPrice)
    .div(xSushiTokenPrice.decimalsBaseTen);

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

export function handleTreeDistribution(event: TreeDistribution): void {
  const timestamp = event.params.timestamp;
  const rewardToken = event.params.token;
  const rewardAmount = event.params.amount;
  const supplySideRevenueUSD = getPriceOfOutputTokens(
    rewardToken,
    rewardAmount
  );

  const strategyAddress = event.address;
  const vaultAddress = utils.getVaultAddressFromStrategy(strategyAddress);
  const vault = getOrCreateVault(vaultAddress, event.block);

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

export function handlePerformanceFeeGovernance(
  event: PerformanceFeeGovernance
): void {
  const token = event.params.token;
  const amount = event.params.amount;
  const amountUSD = getPriceOfOutputTokens(token, amount);
  const protocolSideRevenueUSD = amountUSD;

  const strategyAddress = event.address;
  const vaultAddress = utils.getVaultAddressFromStrategy(strategyAddress);
  const vault = getOrCreateVault(vaultAddress, event.block);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[PerformanceFeeGovernance] Vault: {}, token: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      token.toHexString(),
      amount.toHexString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handlePerformanceFeeStrategist(
  event: PerformanceFeeStrategist
): void {
  const token = event.params.token;
  const amount = event.params.amount;
  const amountUSD = getPriceOfOutputTokens(token, amount);
  const protocolSideRevenueUSD = amountUSD;

  const strategyAddress = event.address;
  const vaultAddress = utils.getVaultAddressFromStrategy(strategyAddress);
  const vault = getOrCreateVault(vaultAddress, event.block);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[PerformanceFeeStrategist] Vault: {}, token: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      token.toHexString(),
      amount.toHexString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
