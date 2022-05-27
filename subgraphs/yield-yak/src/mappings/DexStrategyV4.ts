import { 
  Deposit as DepositEvent,
  Reinvest as ReinvestEvent,
  Withdraw as WithdrawEvent,
  UpdateAdminFee as UpdateAdminFeeEvent,
  UpdateDevFee as UpdateDevFeeEvent,
  UpdateReinvestReward as UpdateReinvestRewardEvent
} from '../../generated/x0aBD79f5144a70bFA3E3Aeed183f9e1A4d80A34F/DexStrategyV4'
import { Deposit, Withdraw} from '../../generated/schema'

import { DexStrategyV4 } from "../../generated/x0aBD79f5144a70bFA3E3Aeed183f9e1A4d80A34F/DexStrategyV4"

import { ZERO_BIGDECIMAL} from "./utils/constants";

import {priceInUSD} from "./PriceCalculator";
import { defineInputToken
  ,defineProtocol
  ,defineUsageMetricsDailySnapshotEntity
  ,defineUsageMetricsHourlySnapshot
  ,defineVault} from "./initialDefineOrLoad";

import { updateRewardParametersOfDailyOrHourlyEntities } from './updateRewardPramatersOfDailyOrHourlyEntities'
import { updateDailyOrHourlyEntities } from './updateDailyOrHourlyEntities'
import { feeUpdater } from './FeeUpdater';

export function handleDeposit(event: DepositEvent): void {
  let transactionHash = event.transaction.hash;
  let logIndex = event.logIndex;
  let deposit = Deposit.load(transactionHash.toHexString().concat("-").concat(logIndex.toHexString()));
  if (deposit == null) {
    deposit = new Deposit(transactionHash.toHexString().concat("-").concat(logIndex.toHexString()));
  }
  let contractAddress = event.address;
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.to = event.address.toHexString();
  deposit.from = event.transaction.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.amount = event.params.amount;
  let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
  let protocol = defineProtocol(contractAddress);
  deposit.protocol =  protocol.id;
  
  if (dexStrategyV4Contract.try_depositToken().reverted) {
    deposit.asset = "";
    deposit.amountUSD = ZERO_BIGDECIMAL;
  } else {
    let inputTokenAddress = dexStrategyV4Contract.depositToken();
    let inputToken = defineInputToken(inputTokenAddress, event.block.number);

    deposit.asset = inputToken.id;
    deposit.amountUSD = priceInUSD(dexStrategyV4Contract.depositToken(), event.transaction.value);
  }
  updateDailyOrHourlyEntities(event.address, event.block.timestamp, event.block.number);

  let usageMetricsDailySnapshotEntity = defineUsageMetricsDailySnapshotEntity(event.block.timestamp,event.block.number,event.address);
  usageMetricsDailySnapshotEntity.dailyDepositCount = usageMetricsDailySnapshotEntity.dailyDepositCount + 1;
  usageMetricsDailySnapshotEntity.save();

  let vault = defineVault(contractAddress, event.block.timestamp, event.block.number);
  deposit.vault = vault.id;

  let usageMetricsHourlySnapshotEntity = defineUsageMetricsHourlySnapshot(event.block.timestamp,event.block.number,event.address);
  usageMetricsHourlySnapshotEntity.hourlyDepositCount = usageMetricsHourlySnapshotEntity.hourlyDepositCount + 1;
  usageMetricsHourlySnapshotEntity.save();

  deposit.save();
}
  
export function handleWithdraw(event: WithdrawEvent): void {
  let contractAddress = event.address;
  let transactionHash = event.transaction.hash;
  let logIndex = event.logIndex;
  let withdraw = Withdraw.load(transactionHash.toHexString().concat("-").concat(logIndex.toHexString()));
  if (withdraw == null) {
    withdraw = new Withdraw(transactionHash.toHexString().concat("-").concat(logIndex.toHexString()));
  }
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.to = contractAddress.toHexString();
  withdraw.from = event.transaction.from.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.amount = event.params.amount;
  let dexStrategyV4Contract = DexStrategyV4.bind(contractAddress);
  let protocol = defineProtocol(contractAddress);
  withdraw.protocol =  protocol.id;
  let inputTokenAddress = dexStrategyV4Contract.depositToken();
  let inputToken = defineInputToken(inputTokenAddress, event.block.number);

  withdraw.asset = inputToken.id;
  if (dexStrategyV4Contract.try_depositToken().reverted) {
    withdraw.amountUSD = ZERO_BIGDECIMAL;
  } else {
    withdraw.amountUSD = priceInUSD(dexStrategyV4Contract.depositToken(), event.transaction.value);
  }

  updateDailyOrHourlyEntities(event.address, event.block.timestamp, event.block.number)

  let usageMetricsDailySnapshotEntity = defineUsageMetricsDailySnapshotEntity(event.block.timestamp,event.block.number,event.address);
  usageMetricsDailySnapshotEntity.dailyWithdrawCount = usageMetricsDailySnapshotEntity.dailyWithdrawCount + 1;
  usageMetricsDailySnapshotEntity.save();
 
  let vault = defineVault(contractAddress, event.block.timestamp, event.block.number);
  withdraw.vault = vault.id;

  let usageMetricsHourlySnapshotEntity = defineUsageMetricsHourlySnapshot(event.block.timestamp,event.block.number,event.address);
  usageMetricsHourlySnapshotEntity.hourlyWithdrawCount = usageMetricsHourlySnapshotEntity.hourlyWithdrawCount + 1;
  usageMetricsHourlySnapshotEntity.save();

  withdraw.save();
}

export function handleReinvest(event: ReinvestEvent): void {
  updateDailyOrHourlyEntities(event.address, event.block.timestamp, event.block.number)
  updateRewardParametersOfDailyOrHourlyEntities(event.address, event.block.timestamp, event.block.number,event.params.newTotalSupply)
}

export function handleUpdateAdminFee(event: UpdateAdminFeeEvent): void {
  feeUpdater(event.address, event.params.newValue, "-adminFee");
}
export function handleUpdateDevFee(event: UpdateDevFeeEvent): void {
  feeUpdater(event.address, event.params.newValue, "-developerFee");
}
export function handleReinvestReward(event: UpdateReinvestRewardEvent): void {
  feeUpdater(event.address, event.params.newValue, "-reinvestorFee");
}