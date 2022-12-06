import {
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateRewardToken,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { MasterBelt as MasterBeltContract } from "../../generated/MasterBelt/MasterBelt";
import { Strategy as StrategyContract } from "../../generated/templates/Strategy/Strategy";

export function updateStakedOutputTokenAmount(
  vaultAddress: Address,
  strategyAddress: Address,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const strategyContract = StrategyContract.bind(strategyAddress);

  const wantLockedTotal = utils.readValue<BigInt>(
    strategyContract.try_wantLockedTotal(),
    constants.BIGINT_ZERO
  );

  vault.stakedOutputTokenAmount = wantLockedTotal;
  vault.save();
}

export function updateBeltRewards(
  vaultAddress: Address,
  allocPoint: BigInt,
  masterBeltAddress: Address,
  block: ethereum.Block
): void {
  const masterBeltContract = MasterBeltContract.bind(masterBeltAddress);

  const beltPerBlock = utils
    .readValue<BigInt>(
      masterBeltContract.try_BELTPerBlock(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  const totalAllocPoint = utils
    .readValue<BigInt>(
      masterBeltContract.try_totalAllocPoint(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  // Get the rewards per day for this gauge
  const protocolTokenRewardEmissionsPerDay = beltPerBlock
    .times(allocPoint.toBigDecimal().div(totalAllocPoint))
    .times(constants.BIG_DECIMAL_SECONDS_PER_DAY.div(constants.BSC_BLOCK_RATE));

  updateRewardTokenEmissions(
    constants.BELT_TOKEN_ADDRESS,
    vaultAddress,
    BigInt.fromString(
      protocolTokenRewardEmissionsPerDay.truncate(0).toString()
    ),
    block
  );
}

export function updateRewardTokenEmissions(
  rewardTokenAddress: Address,
  poolAddress: Address,
  rewardTokenPerDay: BigInt,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(poolAddress, block);
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress, block);

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

  const token = getOrCreateToken(rewardTokenAddress, block);

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .toBigDecimal()
    .div(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
    .times(token.lastPriceUSD!);

  vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  vault.save();
}
