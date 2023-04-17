import { BigInt } from "@graphprotocol/graph-ts";
import {
  AddRewardInfo,
  ComplexRewarderPerSec,
} from "../../generated/ComplexRewarderPerSec/ComplexRewarderPerSec";
import { getOrCreateToken, getOrCreateRewardToken } from "../entities/token";
import { updatePoolRewardToken } from "../entities/pool";
import { takeSnapshots } from "../entities/snapshots";
import { convertTokenToDecimal } from "../utils/numbers";
import { SECONDS_PER_DAY } from "../utils/constants";

export function handleAddRewardInfo(event: AddRewardInfo): void {
  takeSnapshots(event);

  const complexRewarderPerSecContract = ComplexRewarderPerSec.bind(
    event.address
  );
  const tryRewardToken = complexRewarderPerSecContract.try_rewardToken();
  if (tryRewardToken.reverted) {
    return;
  }
  const rewardTokenAddress = tryRewardToken.value;

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const tokensPerDay = event.params.rewardPerSec.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  const rewardToken = getOrCreateRewardToken(event, rewardTokenAddress);
  const token = getOrCreateToken(event, rewardTokenAddress);
  const tokensPerDayUSD = convertTokenToDecimal(
    tokensPerDay,
    token.decimals
  ).times(token.lastPriceUSD!);
  updatePoolRewardToken(event, rewardToken, tokensPerDay, tokensPerDayUSD);
}
