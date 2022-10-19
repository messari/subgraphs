import {
  YakStrategyV2,
  Deposit as DepositEvent,
  Recovered,
  Reinvest,
  UpdateAdminFee,
  UpdateDevFee,
  UpdateReinvestReward,
  Withdraw as WithdrawEvent
} from "../generated/YakStrategyV2/YakStrategyV2"
import { Deposit, Withdraw } from "../generated/schema";
import { defineProtocol, defineInputToken, defineVault, defineUsageMetricsDailySnapshotEntity, defineUsageMetricsHourlySnapshot } from "./utils/initial";
import { ZERO_BIGDECIMAL } from "./utils/constants";
import { calculatePriceInUSD } from "./helpers/calculators";
import { updateDailyOrHourlyEntities } from "./updateDailyOrHourlyEntities";
import { updateRewardParametersOfDailyOrHourlyEntities } from "./updateRewardParametersOfDailyOrHourlyEntities";


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

  let yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);

  let protocol = defineProtocol(contractAddress);
  deposit.protocol =  protocol.id;

  if (yakStrategyV2Contract.try_depositToken().reverted) {
    deposit.asset = "";
    deposit.amountUSD = ZERO_BIGDECIMAL;
  } else {
    let inputTokenAddress = yakStrategyV2Contract.depositToken();
    let inputToken = defineInputToken(inputTokenAddress, event.block.number);

    deposit.asset = inputToken.id;
    deposit.amountUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), event.transaction.value);
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
  let yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  let protocol = defineProtocol(contractAddress);
  withdraw.protocol =  protocol.id;
  let inputTokenAddress = yakStrategyV2Contract.depositToken();
  let inputToken = defineInputToken(inputTokenAddress, event.block.number);

  withdraw.asset = inputToken.id;
  if (yakStrategyV2Contract.try_depositToken().reverted) {
    withdraw.amountUSD = ZERO_BIGDECIMAL;
  } else {
    withdraw.amountUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), event.transaction.value);
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

export function handleReinvest(event: Reinvest): void {
  updateDailyOrHourlyEntities(event.address, event.block.timestamp, event.block.number)
  updateRewardParametersOfDailyOrHourlyEntities(event.address, event.block.timestamp, event.block.number,event.params.newTotalSupply)
}

export function handleRecovered(event: Recovered): void {}
export function handleUpdateAdminFee(event: UpdateAdminFee): void {}
export function handleUpdateDevFee(event: UpdateDevFee): void {}
export function handleUpdateReinvestReward(event: UpdateReinvestReward): void {}

