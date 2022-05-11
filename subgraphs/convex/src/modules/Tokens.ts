import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { RewardTokenInfo } from "../../generated/schema";
import { getOrCreateRewardToken } from "../common/initializer";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { BaseRewardPool } from "../../generated/Booster/BaseRewardPool";

export function getOrCreateRewardTokenInfo(
  poolId: BigInt,
  block: ethereum.Block,
  rewardTokenAddress: Address,
  rewardTokenPool: Address | null = null
): RewardTokenInfo {
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress);

  const rewardTokenInfoId = poolId
    .toString()
    .concat("-")
    .concat(rewardToken.id);
  let rewardTokenInfo = RewardTokenInfo.load(rewardTokenInfoId);

  if (!rewardTokenInfo) {
    rewardTokenInfo = new RewardTokenInfo(rewardTokenInfoId);
    rewardTokenInfo._previousExtraHistoricalRewards = constants.BIGINT_ZERO;
    if (rewardTokenPool)
      rewardTokenInfo.rewardTokenPool = rewardTokenPool.toHexString();

    rewardTokenInfo.lastRewardTimestamp = block.timestamp;
    rewardTokenInfo.save();
  }

  return rewardTokenInfo;
}

export function getExtraRewardTokens(
  poolId: BigInt,
  block: ethereum.Block,
  baseRewardPoolContract: BaseRewardPool
): string[] {
  let extraRewardTokens: string[] = [];

  const extraRewardsLength = utils.readValue<BigInt>(
    baseRewardPoolContract.try_extraRewardsLength(),
    constants.BIGINT_ZERO
  );

  for (
    let rewardTokenIdx = 0;
    rewardTokenIdx < extraRewardsLength.toI32();
    rewardTokenIdx++
  ) {
    const extraBaseRewardPoolAddress = utils.readValue<Address>(
      baseRewardPoolContract.try_extraRewards(BigInt.fromI32(rewardTokenIdx)),
      constants.ZERO_ADDRESS
    );

    const extraBaseRewardPoolContract = BaseRewardPool.bind(
      extraBaseRewardPoolAddress
    );
    const extraRewardTokenAddress = utils.readValue<Address>(
      extraBaseRewardPoolContract.try_rewardToken(),
      constants.ZERO_ADDRESS
    );

    if (extraRewardTokenAddress.toHex() == constants.ZERO_ADDRESS_STRING)
      continue;

    getOrCreateRewardTokenInfo(
      poolId,
      block,
      extraRewardTokenAddress,
      extraBaseRewardPoolAddress
    );
    extraRewardTokens.push(extraRewardTokenAddress.toHexString());
  }

  return extraRewardTokens;
}

export function getRewardTokens(
  poolId: BigInt,
  block: ethereum.Block,
  baseRewardPoolAddress: Address
): string[] {
  const baseRewardPoolContract = BaseRewardPool.bind(baseRewardPoolAddress);

  const crvRewardToken = utils.readValue<Address>(
    baseRewardPoolContract.try_rewardToken(),
    constants.ZERO_ADDRESS
  );

  // Create Reward Token Info for CRV Reward
  getOrCreateRewardTokenInfo(
    poolId,
    block,
    crvRewardToken,
    baseRewardPoolAddress
  );

  let rewardTokens = [crvRewardToken.toHexString()];
  rewardTokens.concat(getExtraRewardTokens(poolId, block, baseRewardPoolContract));

  log.warning("[RewardTokens]  PoolId: {}, Tokens: [{}]", [
    poolId.toString(),
    rewardTokens.join(", "),
  ]);

  return rewardTokens;
}
