import {
  Deposit,
  DepositFor,
  Withdraw,
} from "../../generated/MasterPlatypus/MasterPlatypus";

import { RewardToken, _Asset } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { getOrCreateLiquidityPool, getOrCreateRewardToken, getOrCreateToken } from "../common/getters";
import { MasterPlatypus } from "../../generated/MasterPlatypus/MasterPlatypus";
import { SimpleRewarder } from "../../generated/MasterPlatypus/SimpleRewarder";

import { BIGINT_ZERO, MasterPlatypusAddress } from "../common/constants";
import { tokenAmountToUSDAmount } from "../common/utils/numbers";
import { emissionsPerDay } from "../common/rewards";

export function updatePoolRewards(event: ethereum.Event, poolAddress: Address): void {
  log.debug("[UpdateRewards][{}] get pool {}", [event.transaction.hash.toHexString(), poolAddress.toHexString()]);

  let pool = getOrCreateLiquidityPool(poolAddress, event);
  let poolRewardTokens = new Array<string>();
  let poolRewardTokenEmissionsAmount = new Array<BigInt>();
  let poolRewardTokenEmissionsUSD = new Array<BigDecimal>();

  if (!pool._ignore) {
    for (let j = 0; j < pool._assets.length; j++) {
      let _asset = _Asset.load(pool._assets[j])!;
      log.debug("[UpdateRewards][{}] get asset at {} => {}", [
        event.transaction.hash.toHexString(),
        j.toString(),
        _asset.id,
      ]);

      for (let k = 0; k < _asset.rewardTokens!.length; k++) {
        poolRewardTokenEmissionsAmount[k] = poolRewardTokenEmissionsAmount[k].plus(
          _asset.rewardTokenEmissionsAmount![k],
        );
        poolRewardTokenEmissionsUSD[k] = poolRewardTokenEmissionsUSD[k].plus(_asset.rewardTokenEmissionsUSD![k]);

        log.debug("[UpdateRewards][{}] get RT at {} => {} AMT: {} USD: {}", [
          event.transaction.hash.toHexString(),
          k.toString(),
          _asset.rewardTokenEmissionsAmount![k].toString(),
          _asset.rewardTokenEmissionsUSD![k].toString(),
        ]);
      }
    }
  }

  log.debug("[UpdateRewards][{}] pool {} : final AMT: {} USD: {}", [
    event.transaction.hash.toHexString(),
    pool.id,
    poolRewardTokenEmissionsAmount.toString(),
    poolRewardTokenEmissionsUSD.toString(),
  ]);

  pool.rewardTokens = poolRewardTokens;
  pool.rewardTokenEmissionsAmount = poolRewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = poolRewardTokenEmissionsUSD;
  pool.save();
}

export function addRewardTokenToAsset(event: ethereum.Event, rtAddress: Address, _asset: _Asset): RewardToken {
  let rt = getOrCreateRewardToken(event, rtAddress);

  if (_asset.rewardTokens!.indexOf(rt.id) < 0) {
    let rts = _asset.rewardTokens;
    rts!.push(rt.id);
    _asset.rewardTokens = rts;
    _asset.save();
  }
  return rt;
}

export function getAssetForRewards<T>(event: T): _Asset {
  let MP = MasterPlatypus.bind(event.address);

  let pid = event.params.pid;
  let poolInfo = MP.try_poolInfo(pid);
  if (poolInfo.reverted) {
    log.error("[RewardsHandleWithdraw]error fetching poolInfo for pid {}", [pid.toString()]);
  }

  let poolInfoMap = poolInfo.value;

  // Get Relevant Asset
  let _asset = _Asset.load(poolInfoMap.value0.toHexString());
  if (!_asset) {
    log.error("[RewardsHandleDeposit]Asset not found {}", [poolInfoMap.value0.toHexString()]);
  }
  _asset!._index = pid;
  addRewardTokenToAsset(event, MasterPlatypusAddress, _asset!);

  if (poolInfoMap.value4 != Address.fromHexString("0x0000000000000000000000000000000000000000")) {
    let bonusRewards = MP.try_rewarderBonusTokenInfo(pid);
    if (bonusRewards.reverted) {
      log.error("[RewardsHandleDeposit]error fetching bonusRewards for pid {}", [pid.toString()]);
      return _asset!;
    }
    addRewardTokenToAsset(event, bonusRewards.value.value0, _asset!);
  }

  // // Get info for PTP rewards
  // let baseAllocPoint = poolInfoMap.value1;
  // let lastRewardTimestamp = poolInfoMap.value2;
  // let accPtpPerShare = poolInfoMap.value3;
  let rewarder = poolInfoMap.value4;
  // let sumOfFactors = poolInfoMap.value5;
  // let accPtpPerFactorShare = poolInfoMap.value6;

  let rewardTokenEmissionsAmount = new Array<BigInt>();
  let rewardTokenEmissionsUSD = new Array<BigDecimal>();

  for (let k = 0; k < _asset!.rewardTokens!.length; k++) {
    if (_asset!.rewardTokens![k] == MasterPlatypusAddress.toHexString()) {
      rewardTokenEmissionsAmount[k] = emissionsPerDay(poolInfoMap.value7);
      rewardTokenEmissionsUSD[k] = tokenAmountToUSDAmount(
        getOrCreateToken(event, MasterPlatypusAddress),
        rewardTokenEmissionsAmount[k],
      );
    } else {
      let rewarderContract = SimpleRewarder.bind(rewarder);
      let tps = rewarderContract.try_tokenPerSec();
      if (tps.reverted) {
        log.error("[RewardsHandleDeposit]error fetching simplerewarder {} tokenspersec ", [rewarder.toHexString()]);
      }

      rewardTokenEmissionsAmount[k] = emissionsPerDay(tps.value);

      let tokenAddress = rewarderContract.try_rewardToken();
      if (tokenAddress.reverted) {
        log.error("[RewardsHandleDeposit]error fetching simplerewarder {} tokenspersec ", [rewarder.toHexString()]);
      }

      rewardTokenEmissionsUSD[k] = tokenAmountToUSDAmount(
        getOrCreateToken(event, tokenAddress.value),
        rewardTokenEmissionsAmount[k],
      );
    }
  }

  _asset!.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  _asset!.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  _asset!.save();
  return _asset!;
}

export function handleDeposit(event: Deposit): void {
  let _asset = getAssetForRewards<Deposit>(event);
  _asset.amountStaked = _asset.amountStaked.plus(event.params.amount);
  _asset.save();
  updatePoolRewards(event, Address.fromString(_asset.pool));
}

export function handleWithdraw(event: Withdraw): void {
  let _asset = getAssetForRewards<Withdraw>(event);
  _asset.amountStaked = _asset.amountStaked.minus(event.params.amount);
  _asset.save();
  updatePoolRewards(event, Address.fromString(_asset.pool));
}

export function handleDepositFor(event: DepositFor): void {
  let _asset = getAssetForRewards<DepositFor>(event);
  _asset.amountStaked = _asset.amountStaked.plus(event.params.amount);
  _asset.save();
  updatePoolRewards(event, Address.fromString(_asset.pool));
}
