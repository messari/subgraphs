import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  _LiquidityGauge,
  Vault,
  _RewardData,
  RewardToken,
} from "../../../generated/schema";
import { LiquidityGaugeV4 as GaugeContract } from "../../../generated/templates/LiquidityGauge/LiquidityGaugeV4";
import {
  RewardTokenType,
  SECONDS_PER_DAY,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
} from "../../common/constants";
import { getOrCreateRewardToken } from "../../common/getters";
import { bigIntToBigDecimal } from "../../common/utils/numbers";
import { updateTokenPrice } from "./pricing";

export function getOrCreateLiquidityGauge(
  gaugeAddress: Address
): _LiquidityGauge {
  let gauge = _LiquidityGauge.load(gaugeAddress.toHex());

  if (!gauge) {
    gauge = new _LiquidityGauge(gaugeAddress.toHex());
    gauge.vault = "";
    gauge.save();
  }
  return gauge;
}

export function addRewardToken(
  rewardTokenAddress: Address,
  rewardTokenType: RewardTokenType,
  vault: Vault
): void {
  const rewardToken = getOrCreateRewardToken(
    rewardTokenAddress,
    rewardTokenType
  );

  let rewardTokens = vault.rewardTokens;
  let rewardEmission = vault.rewardTokenEmissionsAmount;
  let rewardEmissionUSD = vault.rewardTokenEmissionsUSD;
  if (!rewardTokens) {
    rewardTokens = [rewardToken.id];
    rewardEmission = [BIGINT_ZERO];
    rewardEmissionUSD = [BIGDECIMAL_ZERO];
  } else {
    const index = rewardTokens.indexOf(rewardToken.id);
    if (index != -1) {
      // Do nothing if rewardToken is already in rewardTokens
      return;
    }

    rewardTokens.push(rewardToken.id);
    rewardEmission!.push(BIGINT_ZERO);
    rewardEmissionUSD!.push(BIGDECIMAL_ZERO);

    const rewardTokensUnsorted = rewardTokens;
    rewardTokens.sort();
    rewardEmission = sortArrayByReference<string, BigInt>(
      rewardTokens,
      rewardTokensUnsorted,
      rewardEmission!
    );
    rewardEmissionUSD = sortArrayByReference<string, BigDecimal>(
      rewardTokens,
      rewardTokensUnsorted,
      rewardEmissionUSD!
    );
  }
  vault.rewardTokens = rewardTokens;
  vault.rewardTokenEmissionsAmount = rewardEmission;
  vault.rewardTokenEmissionsUSD = rewardEmissionUSD;
  vault.save();
}

export function removeRewardToken(rewardTokenId: string, vault: Vault): void {
  const rewardTokens = vault.rewardTokens;
  if (!rewardTokens || rewardTokens.length == 0) {
    return;
  }
  const rewardEmission = vault.rewardTokenEmissionsAmount;
  const rewardEmissionUSD = vault.rewardTokenEmissionsUSD;
  const index = rewardTokens.indexOf(rewardTokenId);
  if (index != -1) {
    rewardTokens.splice(index, 1);
    rewardEmission!.splice(index, 1);
    rewardEmissionUSD!.splice(index, 1);
  }
  vault.rewardTokens = rewardTokens;
  vault.rewardTokenEmissionsAmount = rewardEmission;
  vault.rewardTokenEmissionsUSD = rewardEmissionUSD;
  vault.save();
}

export function updateRewardData(
  gaugeAddress: Address,
  rewardTokenAddress: Address,
  event: ethereum.Event
): void {
  // get new rates
  const gaugeContract = GaugeContract.bind(gaugeAddress);
  const rewardDataResult = gaugeContract.try_reward_data(rewardTokenAddress);
  if (rewardDataResult.reverted) {
    log.error(
      "[updateRewardData]reward_data() call for gauge {} and token {} reverted tx {}-{}",
      [
        gaugeAddress.toHexString(),
        rewardTokenAddress.toHexString(),
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return;
  }
  const rate = rewardDataResult.value.getRate(); // rate is tokens per second
  const periodFinish = rewardDataResult.value.getPeriod_finish();

  const rewardDataId = `${gaugeAddress.toHexString()}-${rewardTokenAddress.toHexString()}`;
  let rewardData = _RewardData.load(rewardDataId);
  if (!rewardData) {
    rewardData = new _RewardData(rewardDataId);
  }
  rewardData.rate = rate;
  rewardData.PeriodFinish = periodFinish;
  rewardData.save();
}

export function updateRewardEmissions(
  vault: Vault,
  gaugeAddress: Address,
  event: ethereum.Event
): void {
  const rewardTokens = vault.rewardTokens ? vault.rewardTokens! : [];

  for (let i = 0; i < rewardTokens.length; i++) {
    updateRewardEmission(vault, rewardTokens[i], gaugeAddress, event);
  }
}

function updateRewardEmission(
  vault: Vault,
  rewardTokenId: string,
  gaugeAddress: Address,
  event: ethereum.Event
): void {
  const rewardToken = RewardToken.load(rewardTokenId);
  if (!rewardToken) {
    log.error(
      "[updateRewardEmission]no RewardToken found for reward token {} tx {}-{}",
      [
        rewardTokenId,
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return;
  }

  const rewardDataId = `${gaugeAddress.toHexString()}-${rewardToken.token}`;
  const rewardData = _RewardData.load(rewardDataId);
  if (!rewardData) {
    log.error(
      "[updateRewardEmission]no RewardData found for gauge {} and reward token {} tx {}-{}",
      [
        gaugeAddress.toHexString(),
        rewardTokenId,
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return;
  }

  const rewardTokens = vault.rewardTokens ? vault.rewardTokens! : [];
  const emissionsAmount = vault.rewardTokenEmissionsAmount
    ? vault.rewardTokenEmissionsAmount!
    : [];
  const emissionsUSD = vault.rewardTokenEmissionsUSD
    ? vault.rewardTokenEmissionsUSD!
    : [];
  const rewardTokenIndex = rewardTokens.indexOf(rewardTokenId);

  // once the reward period is past, the rate goes to 0
  if (event.block.timestamp.ge(rewardData.PeriodFinish)) {
    emissionsAmount[rewardTokenIndex] = BIGINT_ZERO;
    emissionsUSD[rewardTokenIndex] = BIGDECIMAL_ZERO;
  } else {
    emissionsAmount[rewardTokenIndex] = rewardData.rate.times(
      BigInt.fromI32(SECONDS_PER_DAY)
    );
    const token = updateTokenPrice(
      Address.fromString(rewardToken.token),
      event.block
    );
    emissionsUSD[rewardTokenIndex] = token.lastPriceUSD!.times(
      bigIntToBigDecimal(emissionsAmount[rewardTokenIndex], token.decimals)
    );
  }

  vault.rewardTokenEmissionsAmount = emissionsAmount;
  vault.rewardTokenEmissionsUSD = emissionsUSD;
  vault.save();
}

// A function which given 3 arrays of arbitrary types of the same length,
// where the first one holds the reference order, the second one holds the same elements
// as the first but in different order, and the third any arbitrary elements. It will return
// the third array after sorting it according to the order of the first one.
// For example:
// sortArrayByReference(['a', 'c', 'b'], ['a', 'b', 'c'], [1, 2, 3]) => [1, 3, 2]
export function sortArrayByReference<T, K>(
  reference: T[],
  array: T[],
  toSort: K[]
): K[] {
  const sorted: K[] = new Array<K>();
  for (let i = 0; i < reference.length; i++) {
    const index = array.indexOf(reference[i]);
    sorted.push(toSort[index]);
  }
  return sorted;
}
