import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { BigInt } from "@graphprotocol/graph-ts";
import { updateRewardTokenInfo } from "../modules/Rewards";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { getOrCreateToken, getOrCreateVault } from "../common/initializers";
import { UnlockScheduleSet } from "../../generated/templates/Strategy/RewardsLogger";
import { DiggToken as DiggTokenContract } from "../../generated/rewardsLogger/DiggToken";

export function handleUnlockScheduleSet(event: UnlockScheduleSet): void {
  const duration = event.params.duration;
  let totalAmount = event.params.totalAmount;
  const vaultAddress = event.params.beneficiary;
  const rewardTokenAddress = event.params.token;

  const vault = getOrCreateVault(vaultAddress, event.block);

  if (vault._bribesProcessor != constants.NULL.TYPE_STRING) {
    const rewardToken = getOrCreateToken(rewardTokenAddress, event.block);
    const rewardTokenDecimals = constants.BIGINT_TEN.pow(
      rewardToken.decimals as u8
    ).toBigDecimal();

    const supplySideRevenueUSD = totalAmount
      .divDecimal(rewardTokenDecimals)
      .times(rewardToken.lastPriceUSD!);

    updateRevenueSnapshots(
      vault,
      supplySideRevenueUSD,
      constants.BIGDECIMAL_ZERO,
      event.block
    );

    return;
  }

  if (rewardTokenAddress.equals(constants.DIGG_TOKEN_ADDRESS)) {
    const diggContract = DiggTokenContract.bind(constants.DIGG_TOKEN_ADDRESS);

    totalAmount = utils.readValue<BigInt>(
      diggContract.try_sharesToFragments(totalAmount),
      constants.BIGINT_ZERO
    );
  }

  const rewardRate = totalAmount.div(duration);

  updateRewardTokenInfo(
    vault,
    getOrCreateToken(rewardTokenAddress, event.block),
    rewardRate,
    event.block
  );
}
