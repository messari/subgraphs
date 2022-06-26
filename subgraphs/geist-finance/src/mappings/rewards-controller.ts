import { log } from "@graphprotocol/graph-ts";
import { BalanceUpdated, AaveIncentivesController } from "../../generated/RewardsController/AaveIncentivesController";
import { getMarketById, updateMarketRewardTokens } from "../common/market";
import { getReserveOrNull } from "../common/reserve";
import { getOrCreateRewardToken } from "../common/token";
import { BIGINT_ZERO, InterestRateType, RewardTokenType } from "../common/utils/constants";
import { INCENTIVE_CONTROLLER_ADDRESS } from "../common/utils/addresses";

export function handleBalanceUpdated(event: BalanceUpdated): void {
  const incentivesController = AaveIncentivesController.bind(INCENTIVE_CONTROLLER_ADDRESS);

  const try_allocPoint = incentivesController.try_poolInfo(event.params.token);

  let rewardPerSecond = BIGINT_ZERO;
  let distributionEnd = BIGINT_ZERO;
  if (!try_allocPoint.reverted) {
    const allocPoint = try_allocPoint.value.value1;
    const try_rewardPerSecond = incentivesController.try_emissionSchedule(allocPoint);
    if (!try_rewardPerSecond.reverted) {
        distributionEnd = try_rewardPerSecond.value.value0;
        rewardPerSecond = try_rewardPerSecond.value.value1;
    }
  }


  const asset = event.params.token.toHexString();
  const reserve = getReserveOrNull(event.params.token);
  if (reserve == null) {
    log.error(
      "Failed to update rewards, could not find reserve for asset: {}",
      [asset]
    );
    return;
  }

  let rewardTokenType: string;
  let interestRateType: string;
  if (asset == reserve.aToken) {
    rewardTokenType = RewardTokenType.DEPOSIT;
    interestRateType = InterestRateType.VARIABLE;
  } else if (asset == reserve.stableDebtToken) {
    rewardTokenType = RewardTokenType.BORROW;
    interestRateType = InterestRateType.STABLE;
  } else if (asset == reserve.variableDebtToken) {
    rewardTokenType = RewardTokenType.BORROW;
    interestRateType = InterestRateType.VARIABLE;
  } else {
    log.error("Failed to update rewards, could not find asset: {}", [asset]);
    return;
  }
  const rewardToken = getOrCreateRewardToken(
    event.params.token,
    rewardTokenType,
    interestRateType,
    distributionEnd
  );
  updateMarketRewardTokens(
    event,
    getMarketById(reserve.id),
    rewardToken,
    rewardPerSecond
  );
}
