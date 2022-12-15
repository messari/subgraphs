import {
  JSONValueKind,
  log,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { getOrCreateMarket } from "../helpers/market";
import { getOrCreateRewardToken, getOrCreateToken } from "../helpers/token";
import { EventData } from "../utils/type";

export function handleAddAssetFarmReward(event: EventData): void {
  const data = event.data;

  const farmId = data.get("farm_id");
  if (!farmId) {
    log.warning("handleAddAssetFarmReward() :: farm_id not found", []);
    return;
  }
  if (farmId.kind != JSONValueKind.OBJECT) {
    log.info("handleAddAssetFarmReward() :: Incorrect type farm_id {}", [
      farmId.kind.toString(),
    ]);
    return;
  }
  const farmIdObj = farmId.toObject();
  let farmIdAsset = farmIdObj.get("Supplied");
  let farmType = "DEPOSIT";
  if (!farmIdAsset) {
    farmIdAsset = farmIdObj.get("Borrowed");
    farmType = "BORROW";
    if (!farmIdAsset) {
      log.warning("handleAddAssetFarmReward() :: farm_id_asset not found", []);
      return;
    }
  }
  const farm = farmIdAsset.toString();

  const rewardTokenId = data.get("reward_token_id");
  if (!rewardTokenId) {
    log.warning("handleAddAssetFarmReward() :: reward_token_id not found", []);
    return;
  }
  const reward_token = rewardTokenId.toString();

  const newRewardPerDay_ = data.get("new_reward_per_day");
  if (!newRewardPerDay_) {
    log.warning(
      "handleAddAssetFarmReward() :: new_reward_per_day not found",
      []
    );
    return;
  }
  const newRewardPerDay = newRewardPerDay_.toString();

  const newBoosterLogBase = data.get("new_booster_log_base");
  if (!newBoosterLogBase) {
    log.warning(
      "handleAddAssetFarmReward() :: new_booster_log_base not found",
      []
    );
    return;
  }

  const rewardAmount = data.get("reward_amount");
  const rewardToken = getOrCreateRewardToken(reward_token, farmType);

  const market = getOrCreateMarket(farm);
  const rewardTokens = market.rewardTokens!;
  // push if reward token does not exists, get index
  let rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  if (rewardTokenIndex == -1) {
    rewardTokens.push(rewardToken.id);
    market.rewardTokens = rewardTokens;
    rewardTokenIndex = rewardTokens.length - 1;
  }

  // add reward_amount to _reward_remaining_amounts
  const _rewardRemainingAmounts = market._reward_remaining_amounts;
  if (_rewardRemainingAmounts.length <= rewardTokenIndex) {
    _rewardRemainingAmounts.push(BigInt.fromString(rewardAmount!.toString()));
  } else {
    _rewardRemainingAmounts[rewardTokenIndex] =
      market._reward_remaining_amounts[rewardTokenIndex].plus(
        BigInt.fromString(rewardAmount!.toString())
      );
  }
  market._reward_remaining_amounts = _rewardRemainingAmounts;

  // rewardTokenEmissionsAmount
  const rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  if (rewardTokenEmissionsAmount!.length <= rewardTokenIndex) {
    rewardTokenEmissionsAmount!.push(
      BigInt.fromString(newRewardPerDay.toString())
    );
  } else {
    rewardTokenEmissionsAmount![rewardTokenIndex] = BigInt.fromString(
      newRewardPerDay.toString()
    );
  }
  market.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;

  // rewardTokenEmissionsUSD
  const rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  const token = getOrCreateToken(rewardToken.token);
  const price = token.lastPriceUSD!;

  const rewardUSD = BigDecimal.fromString(newRewardPerDay.toString())
    .div(
      BigInt.fromString("10")
        .pow((token.decimals + token.extraDecimals) as u8)
        .toBigDecimal()
    )
    .times(price);
  if (rewardTokenEmissionsUSD!.length <= rewardTokenIndex) {
    rewardTokenEmissionsUSD!.push(rewardUSD);
  } else {
    rewardTokenEmissionsUSD![rewardTokenIndex] = rewardUSD;
  }
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  market.save();
}
