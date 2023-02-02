import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateVault,
  getOrCreateToken,
  getOrCreateRewardToken,
} from "../common/initalizers";
import * as utils from "../common/utils";
import { Vault } from "../../generated/schema";
import * as constants from "../common/constants";
import { RewardsInfoType } from "../common/types";
import { getRewardsPerDay } from "../common/rewards";
import { GaugeController as GaugeControllerContract } from "../../generated/rETHThetaGauge/GaugeController";
import { LiquidityGaugeV5 as LiquidityGaugeContract } from "../../generated/rETHThetaGauge/LiquidityGaugeV5";

export function getRewardsData_v1(
  gaugeAddress: Address,
  block: ethereum.Block
): RewardsInfoType {
  const rewardRates: BigInt[] = [];
  const rewardTokens: Address[] = [];

  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  const rewardToken = constants.RBN_TOKEN;
  rewardTokens.push(rewardToken);

  const rewardRate = utils.readValue<BigInt>(
    gaugeContract.try_rewardRate(),
    constants.BIGINT_ZERO
  );
  const periodFinish = utils.readValue<BigInt>(
    gaugeContract.try_periodFinish(),
    constants.BIGINT_ZERO
  );

  if (periodFinish.lt(block.timestamp)) {
    rewardRates.push(constants.BIGINT_ZERO);
  } else {
    rewardRates.push(rewardRate);
  }

  return new RewardsInfoType(rewardTokens, rewardRates);
}

export function updateStakedOutputTokenAmount(
  vaultAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  const vaultStore = Vault.load(vaultAddress.toHexString());
  if (!vaultStore) return;

  const vault = getOrCreateVault(vaultAddress, block);
  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  const gaugeWorkingSupply = utils.readValue<BigInt>(
    gaugeContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  vault.stakedOutputTokenAmount = gaugeWorkingSupply;

  if (gaugeWorkingSupply.equals(constants.BIGINT_ZERO)) {
    const gaugeTotalSupply = utils.readValue<BigInt>(
      gaugeContract.try_totalSupply(),
      constants.BIGINT_ZERO
    );

    vault.stakedOutputTokenAmount = gaugeTotalSupply;
  }

  vault.save();
}

export function updateFactoryRewards(
  vaultAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  const rewardsInfo = getRewardsData_v1(gaugeAddress, block);

  const rewardTokens = rewardsInfo.getRewardTokens;
  const rewardRates = rewardsInfo.getRewardRates;

  for (let i = 0; i < rewardTokens.length; i += 1) {
    const rewardToken = rewardTokens[i];
    const rewardRate = rewardRates[i];

    const rewardRatePerDay = getRewardsPerDay(
      block.timestamp,
      block.number,
      rewardRate.toBigDecimal(),
      constants.RewardIntervalType.TIMESTAMP
    );

    const rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());
    updateRewardTokenEmissions(rewardToken, rewardPerDay, vaultAddress, block);

    log.warning("[Rewards] Vault: {}, RewardToken: {}, RewardRate: {}", [
      vaultAddress.toHexString(),
      rewardToken.toHexString(),
      rewardRatePerDay.toString(),
    ]);
  }
}

export function updateRbnRewardsInfo(
  gaugeAddress: Address,
  vaultAddress: Address,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);

  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);
  const gaugeControllerContract = GaugeControllerContract.bind(
    constants.GAUGE_CONTROLLER_ADDRESS
  );

  const inflationRate = utils
    .readValue<BigInt>(
      gaugeContract.try_inflation_rate(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  const gaugeRelativeWeight = utils
    .readValue<BigInt>(
      gaugeControllerContract.try_gauge_relative_weight(gaugeAddress),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  // rewards = inflation_rate * gauge_relative_weight * seconds_per_day 
  const rbnRewardEmissionsPerDay = inflationRate
    .times(gaugeRelativeWeight.div(constants.BIGINT_TEN.pow(18).toBigDecimal()))
    .times(BigDecimal.fromString(constants.SECONDS_PER_DAY.toString()));

  updateRewardTokenEmissions(
    constants.RBN_TOKEN,
    BigInt.fromString(rbnRewardEmissionsPerDay.truncate(0).toString()),
    vaultAddress,
    block
  );
  log.warning(
    "[updateRbnRewardsInfo] inflationRate {} gaugeRelativeWeight {} emissionsPerDay {} vault {}",
    [
      inflationRate.toString(),
      gaugeRelativeWeight.toString(),
      rbnRewardEmissionsPerDay.toString(),
      vault.id,
    ]
  );
}

export function updateRewardTokenEmissions(
  rewardTokenAddress: Address,
  rewardTokenPerDay: BigInt,
  vaultAddress: Address,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);

  const rewardToken = getOrCreateRewardToken(
    rewardTokenAddress,
    vaultAddress,
    block,
    false
  );

  if (!vault.rewardTokens) {
    vault.rewardTokens = [];
  }

  const rewardTokens = vault.rewardTokens!;
  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
    vault.rewardTokens = rewardTokens;
  }

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);

  if (!vault.rewardTokenEmissionsAmount) {
    vault.rewardTokenEmissionsAmount = [];
  }
  const rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount!;

  if (!vault.rewardTokenEmissionsUSD) {
    vault.rewardTokenEmissionsUSD = [];
  }
  const rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD!;

  const token = getOrCreateToken(
    rewardTokenAddress,
    block,
    vaultAddress,
    false
  );

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .toBigDecimal()
    .div(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
    .times(token.lastPriceUSD!);

  vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  vault.save();

  log.warning(
    "[updateRewardTokenEmmission] rewardTokenEmissionsAmount {} RewardTokenEmissionUSD {} RewardTokenIndex {} vault {} rewardTokenEmissionsAmountLength {} rewardTokenEmissionsUSDLength {}",
    [
      rewardTokenEmissionsAmount.toString(),
      rewardTokenEmissionsUSD.toString(),
      rewardTokenIndex.toString(),
      vault.id,
      vault.rewardTokenEmissionsAmount!.length.toString(),
      vault.rewardTokenEmissionsUSD!.length.toString(),
    ]
  );
}
