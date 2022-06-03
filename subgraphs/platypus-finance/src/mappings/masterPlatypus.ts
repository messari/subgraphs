import {
  Add,
  Deposit,
  DepositFor,
  EmergencyWithdraw,
  Harvest,
  OwnershipTransferred,
  Paused,
  Set,
  Unpaused,
  UpdateEmissionRate,
  UpdateEmissionRepartition,
  UpdatePool,
  UpdateVePTP,
  Withdraw,
} from "../../generated/MasterPlatypus/MasterPlatypus";

import { LiquidityPool, _Asset } from "../../generated/schema";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { getOrCreateLiquidityPool, getOrCreateRewardToken } from "../common/getters";
import { MasterPlatypus } from "../../generated/MasterPlatypus/MasterPlatypus";
import { MasterPlatypusAddress } from "../common/constants";

let MP = MasterPlatypus.bind(MasterPlatypusAddress);

export function checkAddRewardTokenToAssetAndPool(event: ethereum.Event, rtAddress: Address, _asset: _Asset) {
  let rt = getOrCreateRewardToken(event, rtAddress);
  let pool = getOrCreateLiquidityPool(Address.fromHexString(_asset.pool), event);

  if (_asset.rewardTokens!.indexOf(rt.id) < 0) {
    let rts = _asset.rewardTokens;
    rts!.push(rt.id);
    _asset.rewardTokens = rts;
    _asset.save();
  }

  if (pool.rewardTokens!.indexOf(rt.id) < 0) {
    let rts = pool.rewardTokens;
    rts!.push(rt.id);
    pool.rewardTokens = rts;
    pool.save();
  }
}

export function handleDeposit(event: Deposit): void {
  let pid = event.params.pid;
  let poolInfo = MP.try_poolInfo(pid);
  if (poolInfo.reverted) {
    log.error("[RewardsHandleDeposit]error fetching poolInfo for pid {}", [pid.toString()]);
    return;
  }

  let poolInfoMap = poolInfo.value;
  let _asset = _Asset.load(poolInfoMap.value0.toHexString());

  if (!_asset) {
    log.error("[RewardsHandleDeposit]Asset not found {}", [poolInfoMap.value0.toHexString()]);
    return;
  }

  _asset!.amountStaked = _asset!.amountStaked.plus(event.params.amount);
  _asset!.save();

  if (poolInfoMap.value4 != Address.fromHexString("0x0000000000000000000000000000000000000000")) {
    let bonusRewards = MP.try_rewarderBonusTokenInfo(pid);
    if (bonusRewards.reverted) {
      log.error("[RewardsHandleDeposit]error fetching bonusRewards for pid {}", [pid.toString()]);
      return;
    }
    checkAddRewardTokenToAssetAndPool(event, bonusRewards.value.value0, _asset);
  }
}

export function handleWithdraw(event: Withdraw): void {
  let pid = event.params.pid;
  let poolInfo = MP.try_poolInfo(pid);
  if (poolInfo.reverted) {
    log.error("[RewardsHandleWithdraw]error fetching poolInfo for pid {}", [pid.toString()]);
    return;
  }

  let poolInfoMap = poolInfo.value;
  let _asset = _Asset.load(poolInfoMap.value0.toHexString());

  if (!_asset) {
    log.error("[RewardsHandleWithdraw]Asset not found {}", [poolInfoMap.value0.toHexString()]);
    return;
  }

  _asset!.amountStaked = _asset!.amountStaked.minus(event.params.amount);
  _asset!.save();

  if (poolInfoMap.value4 != Address.fromHexString("0x0000000000000000000000000000000000000000")) {
    let bonusRewards = MP.try_rewarderBonusTokenInfo(pid);
    if (bonusRewards.reverted) {
      log.error("[RewardsHandleWithdraw]error fetching bonusRewards for pid {}", [pid.toString()]);
      return;
    }
    checkAddRewardTokenToAssetAndPool(event, bonusRewards.value.value0, _asset);
  }
}

export function handleDepositFor(event: DepositFor): void {
  handleDeposit(event);
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {}
export function handleHarvest(event: Harvest): void {}
export function handleOwnershipTransferred(event: OwnershipTransferred): void {}
export function handlePaused(event: Paused): void {}
export function handleSet(event: Set): void {}
export function handleUnpaused(event: Unpaused): void {}
export function handleUpdateEmissionRate(event: UpdateEmissionRate): void {}
export function handleUpdateEmissionRepartition(event: UpdateEmissionRepartition): void {}
export function handleUpdatePool(event: UpdatePool): void {}
export function handleUpdateVePTP(event: UpdateVePTP): void {}

export function handleRewards(pool: LiquidityPool, blockNumber: BigInt, timestamp: BigInt): void {
  for (let i = 0; i < pool.rewardTokens!.length; i++) {
    let rewardTokenId = pool.rewardTokens![i];
    let rewardToken = getRewardtoken(rewardTokenId);
    calculateEmissions(pool, blockNumber, timestamp, i);
  }
}
