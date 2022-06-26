import { log } from "@graphprotocol/graph-ts";
import { AssetConfigUpdated } from "../../../../generated/RewardsController/RewardsController";
import { getMarketById, updateMarketRewardTokens } from "../entities/market";
import { getReserveOrNull } from "../entities/reserve";
import { getOrCreateRewardToken } from "../entities/token";
import { InterestRateType, RewardTokenType } from "../../../../src/utils/constants";

export function handleAssetConfigUpdated(event: AssetConfigUpdated): void {
  const asset = event.params.asset.toHexString();
  const reserve = getReserveOrNull(event.params.asset);
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
    event.params.reward,
    rewardTokenType,
    interestRateType,
    event.params.newDistributionEnd
  );
  updateMarketRewardTokens(
    event,
    getMarketById(reserve.id),
    rewardToken,
    event.params.newEmission
  );
}
