import { BigInt } from "@graphprotocol/graph-ts";
import {
  TokensPerIntervalChange,
  RewardDistributor,
} from "../../generated/FeeGlpRewardDistributor/RewardDistributor";
import { getOrCreateToken, getOrCreateRewardToken } from "../entities/token";
import { getOrCreatePool } from "../entities/pool";
import { RewardTokenType, SECONDS_PER_DAY } from "../utils/constants";
import { bigIntToBigDecimal, insert } from "../utils/numbers";

export function handleEthToGlpChange(event: TokensPerIntervalChange): void {
  handleTokensPerIntervalChange(event);
}

export function handleEsgmxToGlpChange(event: TokensPerIntervalChange): void {
  handleTokensPerIntervalChange(event);
}

function handleTokensPerIntervalChange(event: TokensPerIntervalChange): void {
  const rewardDistributorContract = RewardDistributor.bind(event.address);
  const tryRewardToken = rewardDistributorContract.try_rewardToken();
  if (tryRewardToken.reverted) {
    return;
  }
  const rewardTokenAddress = tryRewardToken.value;

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const tokensPerDay = event.params.amount.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  const rewardToken = getOrCreateRewardToken(
    rewardTokenAddress,
    RewardTokenType.DEPOSIT,
    event.block.number
  );
  const token = getOrCreateToken(rewardTokenAddress, event.block.number);
  const tokensPerDayUSD = bigIntToBigDecimal(
    tokensPerDay,
    token.decimals
  ).times(token.lastPriceUSD!);

  const pool = getOrCreatePool(event.block.number, event.block.timestamp);
  let rewardTokens = pool.rewardTokens!;
  let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;
  let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;
  let appendData = false;
  const length = rewardTokens.length;
  if (length == 0) {
    // need to append data to the array
    appendData = true;
  } else {
    for (let i = 0; i < length; i++) {
      const index = rewardToken.id.localeCompare(rewardTokens[i]);
      if (index < 0) {
        // insert data at index i
        rewardTokens = insert(rewardTokens, i, rewardToken.id);
        rewardTokenEmissionsAmount = insert(
          rewardTokenEmissionsAmount,
          i,
          tokensPerDay
        );
        rewardTokenEmissionsUSD = insert(
          rewardTokenEmissionsUSD,
          i,
          tokensPerDayUSD
        );

        break;
      } else if (index == 0) {
        // update the data at index i
        rewardTokenEmissionsAmount[i] = tokensPerDay;
        rewardTokenEmissionsUSD[i] = tokensPerDayUSD;

        break;
      } else {
        if (i == rewardTokens.length - 1) {
          // need to append data at end of array
          appendData = true;

          break;
        }
      }
    }
  }

  if (appendData) {
    // append data at end of array
    rewardTokens.push(rewardToken.id);
    rewardTokenEmissionsAmount.push(tokensPerDay);
    rewardTokenEmissionsUSD.push(tokensPerDayUSD);
  }

  pool.rewardTokens = rewardTokens;
  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  pool.save();
}
