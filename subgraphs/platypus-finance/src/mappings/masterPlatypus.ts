import { Deposit, DepositFor, EmergencyWithdraw, Withdraw } from "../../generated/MasterPlatypus/MasterPlatypus";

import { LiquidityPool, RewardToken, _Asset } from "../../generated/schema";
import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { getOrCreateRewardToken, getOrCreateToken } from "../common/getters";
import { MasterPlatypus } from "../../generated/MasterPlatypus/MasterPlatypus";
import { MasterPlatypusOld } from "../../generated/MasterPlatypusOld/MasterPlatypusOld";
import { MasterPlatypusFactory } from "../../generated/MasterPlatypusFactory/MasterPlatypusFactory";
import { SimpleRewarder } from "../../generated/MasterPlatypus/SimpleRewarder";

import {
  BIGINT_ZERO,
  MasterPlatypusFactory_ADDRESS,
  MasterPlatypusOld_ADDRESS,
  PTPAddress,
  ZERO_ADDRESS,
} from "../common/constants";
import { tokenAmountToUSDAmount } from "../common/utils/numbers";
import { emissionsPerDay } from "../common/rewards";

export function handleOldPlatypus<T>(event: T, pid: BigInt): _Asset {
  let MasterPlatypusContract = MasterPlatypusOld.bind(MasterPlatypusOld_ADDRESS);

  let poolInfo = MasterPlatypusContract.try_poolInfo(pid);
  if (poolInfo.reverted) {
    log.error("[HandleRewards][{}]error fetching poolInfo for pid {} from MP {}", [
      event.transaction.hash.toHexString(),
      pid.toString(),
      event.address.toHexString(),
    ]);
  }
  let poolInfoMap = poolInfo.value;
  let poolPoints = poolInfoMap.value1;

  let _asset = _Asset.load(poolInfoMap.value0.toHexString());
  if (!_asset) {
    log.error("[HandleRewards][{}]Asset not found {}", [
      event.transaction.hash.toHexString(),
      poolInfoMap.value0.toHexString(),
    ]);
  }

  // _asset!._index = pid;
  addRewardTokenToAsset(event, Address.fromString(PTPAddress), _asset!);

  _asset!.save();

  let getTotalPoints_call = MasterPlatypusContract.try_totalAllocPoint();
  if (getTotalPoints_call.reverted) {
    log.error("[HandleRewards][{}]error fetching Ptp per second for pid {} old master plat", [
      event.transaction.hash.toHexString(),
      pid.toString(),
    ]);
  }

  let totalPoints = getTotalPoints_call.value;

  let ptpPerSecond_call = MasterPlatypusContract.try_ptpPerSec();
  if (ptpPerSecond_call.reverted) {
    log.error("[HandleRewards][{}]error fetching Ptp per second for pid {} old master plat", [
      event.transaction.hash.toHexString(),
      pid.toString(),
    ]);
  }

  let ptpPerSecond = ptpPerSecond_call.value;
  let rewarder = poolInfoMap.value4;
  if (rewarder.notEqual(ZERO_ADDRESS)) {
    let bonusRewards = MasterPlatypusContract.try_rewarderBonusTokenInfo(pid);
    if (bonusRewards.reverted) {
      log.error("[HandleRewards][{}]error fetching bonusRewards for pid {}", [
        event.transaction.hash.toHexString(),
        pid.toString(),
      ]);
    }
    addRewardTokenToAsset(event, bonusRewards.value.value0, _asset!);
  }

  let rewardTokenEmissionsAmount = new Array<BigInt>();
  let rewardTokenEmissionsUSD = new Array<BigDecimal>();

  for (let k = 0; k < _asset!.rewardTokens!.length; k++) {
    let tps: BigInt;
    let rewardToken = RewardToken.load(_asset!.rewardTokens![k])!;
    let token = getOrCreateToken(event, Address.fromString(rewardToken.token));

    log.debug("[HandleRewards][{}] Asset: {}, RT: {}, rewarder: {}", [
      event.transaction.hash.toHexString(),
      _asset!.id.toString(),
      rewardToken.id.toString(),
      rewarder.toHexString(),
    ]);

    if (token.id == PTPAddress) {
      tps = ptpPerSecond.times(poolPoints).div(totalPoints);
    } else {
      tps = getBonusRewardTPS(rewarder);
    }

    log.debug("rt {} tps {}", [rewardToken.id.toString(), tps.toString()]);
    rewardTokenEmissionsAmount.push(emissionsPerDay(tps));
    rewardTokenEmissionsUSD.push(tokenAmountToUSDAmount(token, emissionsPerDay(tps)));
  }

  _asset!.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  _asset!.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  _asset!.save();
  return _asset!;
}

export function handleFactoryPlatypus<T>(event: T, pid: BigInt): _Asset {
  let MasterPlatypusContract = MasterPlatypusFactory.bind(MasterPlatypusFactory_ADDRESS);

  let poolInfo = MasterPlatypusContract.try_poolInfo(pid);
  if (poolInfo.reverted) {
    log.error("[HandleRewards][{}]error fetching poolInfo for pid {} from MP {}", [
      event.transaction.hash.toHexString(),
      pid.toString(),
      event.address.toHexString(),
    ]);
  }
  let poolInfoMap = poolInfo.value;
  let poolPoints = poolInfoMap.value1;
  let _asset = _Asset.load(poolInfoMap.value0.toHexString());
  if (!_asset) {
    log.error("[HandleRewards][{}]Asset not found {}", [
      event.transaction.hash.toHexString(),
      poolInfoMap.value0.toHexString(),
    ]);
  }

  // _asset!._index = pid;
  addRewardTokenToAsset(event, Address.fromString(PTPAddress), _asset!);

  _asset!.save();

  let getTotalPoints_call = MasterPlatypusContract.try_totalBaseAllocPoint();
  if (getTotalPoints_call.reverted) {
    log.error("[HandleRewards][{}]error fetching Ptp per second for pid {} old master plat", [
      event.transaction.hash.toHexString(),
      pid.toString(),
    ]);
  }

  let totalPoints = getTotalPoints_call.value;
  let ptpPerSecond_call = MasterPlatypusContract.try_ptpPerSec();
  if (ptpPerSecond_call.reverted) {
    log.error("[HandleRewards][{}]error fetching Ptp per second for pid {} old master plat", [
      event.transaction.hash.toHexString(),
      pid.toString(),
    ]);
  }

  let ptpPerSecond = ptpPerSecond_call.value;
  let rewarder = poolInfoMap.value4;

  if (rewarder.notEqual(ZERO_ADDRESS)) {
    let bonusRewards = MasterPlatypusContract.try_rewarderBonusTokenInfo(pid);
    if (bonusRewards.reverted) {
      log.error("[HandleRewards][{}]error fetching bonusRewards for pid {}", [
        event.transaction.hash.toHexString(),
        pid.toString(),
      ]);
    }
    addRewardTokenToAsset(event, bonusRewards.value.value0, _asset!);
  }

  let rewardTokenEmissionsAmount = new Array<BigInt>();
  let rewardTokenEmissionsUSD = new Array<BigDecimal>();

  for (let k = 0; k < _asset!.rewardTokens!.length; k++) {
    let tps: BigInt;
    let rewardToken = RewardToken.load(_asset!.rewardTokens![k])!;
    let token = getOrCreateToken(event, Address.fromString(rewardToken.token));

    log.debug("[HandleRewards][{}] Asset: {}, RT: {}, rewarder: {}", [
      event.transaction.hash.toHexString(),
      _asset!.id.toString(),
      rewardToken.id.toString(),
      rewarder.toHexString(),
    ]);

    if (token.id == PTPAddress) {
      tps = ptpPerSecond.times(poolPoints).div(totalPoints);
    } else {
      tps = getBonusRewardTPS(rewarder);
    }

    log.debug("rt {} tps {}", [rewardToken.id.toString(), tps.toString()]);
    rewardTokenEmissionsAmount.push(emissionsPerDay(tps));
    rewardTokenEmissionsUSD.push(tokenAmountToUSDAmount(token, emissionsPerDay(tps)));
  }

  _asset!.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  _asset!.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  _asset!.save();
  return _asset!;
}

export function handlePlatypus<T>(event: T, pid: BigInt): _Asset {
  let MasterPlatypusContract = MasterPlatypus.bind(event.address);

  let poolInfo = MasterPlatypusContract.try_poolInfo(pid);
  if (poolInfo.reverted) {
    log.error("[HandleRewards][{}]error fetching poolInfo for pid {} from MP {}", [
      event.transaction.hash.toHexString(),
      pid.toString(),
      event.address.toHexString(),
    ]);
  }
  let poolInfoMap = poolInfo.value;
  let poolPoints = poolInfoMap.value7;

  let _asset = _Asset.load(poolInfoMap.value0.toHexString());
  if (!_asset) {
    log.error("[HandleRewards][{}]Asset not found {}", [
      event.transaction.hash.toHexString(),
      poolInfoMap.value0.toHexString(),
    ]);
  }

  // _asset!._index = pid;
  addRewardTokenToAsset(event, Address.fromString(PTPAddress), _asset!);

  _asset!.save();

  let getTotalPoints_call = MasterPlatypusContract.try_totalAdjustedAllocPoint();
  if (getTotalPoints_call.reverted) {
    log.error("[HandleRewards][{}]error fetching Ptp per second for pid {} old master plat", [
      event.transaction.hash.toHexString(),
      pid.toString(),
    ]);
  }

  let totalPoints = getTotalPoints_call.value;
  let ptpPerSecond_call = MasterPlatypusContract.try_ptpPerSec();
  if (ptpPerSecond_call.reverted) {
    log.error("[HandleRewards][{}]error fetching Ptp per second for pid {} old master plat", [
      event.transaction.hash.toHexString(),
      pid.toString(),
    ]);
  }

  let ptpPerSecond = ptpPerSecond_call.value;
  let rewarder = poolInfoMap.value4;
  if (rewarder.notEqual(ZERO_ADDRESS)) {
    let bonusRewards = MasterPlatypusContract.try_rewarderBonusTokenInfo(pid);
    if (bonusRewards.reverted) {
      log.error("[HandleRewards][{}]error fetching bonusRewards for pid {}", [
        event.transaction.hash.toHexString(),
        pid.toString(),
      ]);
    }
    addRewardTokenToAsset(event, bonusRewards.value.value0, _asset!);
  }

  let rewardTokenEmissionsAmount = new Array<BigInt>();
  let rewardTokenEmissionsUSD = new Array<BigDecimal>();

  for (let k = 0; k < _asset!.rewardTokens!.length; k++) {
    let tps: BigInt;
    let rewardToken = RewardToken.load(_asset!.rewardTokens![k])!;
    let token = getOrCreateToken(event, Address.fromString(rewardToken.token));

    log.debug("[HandleRewards][{}] Asset: {}, RT: {}, rewarder: {}", [
      event.transaction.hash.toHexString(),
      _asset!.id.toString(),
      rewardToken.id.toString(),
      rewarder.toHexString(),
    ]);

    if (token.id == PTPAddress) {
      tps = ptpPerSecond.times(poolPoints).div(totalPoints);
    } else {
      tps = getBonusRewardTPS(rewarder);
    }

    log.debug("rt {} tps {}", [rewardToken.id.toString(), tps.toString()]);
    rewardTokenEmissionsAmount.push(emissionsPerDay(tps));
    rewardTokenEmissionsUSD.push(tokenAmountToUSDAmount(token, emissionsPerDay(tps)));
  }

  _asset!.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  _asset!.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  _asset!.save();
  return _asset!;
}

export function updatePoolRewards(event: ethereum.Event, assetAddress: Address): void {
  log.debug("[UpdateRewards][{}] get pool {}", [event.transaction.hash.toHexString(), assetAddress.toHexString()]);

  let pool = LiquidityPool.load(assetAddress.toHexString())!;
  if (!pool._ignore) {
    let _asset = _Asset.load(assetAddress.toHexString())!;
    if (_asset.rewardTokens) {
      pool.rewardTokens = _asset.rewardTokens;
      pool.rewardTokenEmissionsAmount = _asset.rewardTokenEmissionsAmount;
      pool.rewardTokenEmissionsUSD = _asset.rewardTokenEmissionsUSD;
      pool.save();
    }
  }

  log.debug("[UpdateRewards][{}] pool {} : final AMT: {} USD: {}", [
    event.transaction.hash.toHexString(),
    pool.id,
    pool.rewardTokenEmissionsAmount!.toString(),
    pool.rewardTokenEmissionsUSD!.toString(),
  ]);
}

export function addRewardTokenToAsset(event: ethereum.Event, rtAddress: Address, _asset: _Asset): RewardToken {
  let rt = getOrCreateRewardToken(event, rtAddress);
  let rts = _asset.rewardTokens;

  if (!rts) {
    rts = new Array<string>();
  }
  if (rts.indexOf(rt.id) < 0) {
    rts.push(rt.id);
    log.debug("Added Reward {} Token {} to Asset {}", [
      rt.id.toString(),
      rtAddress.toHexString(),
      _asset.id.toString(),
    ]);
    _asset.rewardTokens = rts;
    _asset.save();
  }
  return rt;
}

export function getBonusRewardTPS(rewarder: Address): BigInt {
  if (rewarder.equals(ZERO_ADDRESS)) {
    return BIGINT_ZERO;
  }
  let rewarderContract = SimpleRewarder.bind(rewarder);
  let tps = rewarderContract.try_tokenPerSec();
  if (tps.reverted) {
    log.error("[HandleRewards]error fetching simplerewarder {} getting tps ", [
      rewarderContract._address.toHexString(),
    ]);
  }
  return tps.value;
}

export function getAssetForRewards<T>(event: T): _Asset {
  let pid = event.params.pid;
  if (event.address.equals(MasterPlatypusOld_ADDRESS)) {
    return handleOldPlatypus(event, pid);
  } else if (event.address == MasterPlatypusFactory_ADDRESS) {
    return handleFactoryPlatypus(event, pid);
  } else {
    return handlePlatypus(event, pid);
  }
}

export function handleDeposit(event: Deposit): void {
  let _asset: _Asset;
  _asset = getAssetForRewards<Deposit>(event);
  _asset.amountStaked = _asset.amountStaked.plus(event.params.amount);
  _asset.save();
  updatePoolRewards(event, Address.fromString(_asset.id));
}

export function handleWithdraw(event: Withdraw): void {
  let _asset: _Asset;
  _asset = getAssetForRewards<Withdraw>(event);
  _asset.amountStaked = _asset.amountStaked.minus(event.params.amount);
  _asset.save();
  updatePoolRewards(event, Address.fromString(_asset.id));
}

export function handleDepositFor(event: DepositFor): void {
  let _asset: _Asset;
  _asset = getAssetForRewards<DepositFor>(event);
  _asset.amountStaked = _asset.amountStaked.plus(event.params.amount);
  _asset.save();
  updatePoolRewards(event, Address.fromString(_asset.id));
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {}
