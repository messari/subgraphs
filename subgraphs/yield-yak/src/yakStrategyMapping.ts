import {
  YakStrategyV2,
  AllowDepositor,
  Approval,
  Deposit as DepositEvent,
  DepositsEnabled,
  OwnershipTransferred,
  Recovered,
  Reinvest,
  RemoveDepositor,
  Transfer,
  UpdateAdminFee,
  UpdateDevAddr,
  UpdateDevFee,
  UpdateMaxTokensToDepositWithoutReinvest,
  UpdateMinTokensToReinvest,
  UpdateReinvestReward,
  Withdraw
} from "../generated/YakStrategyV2/YakStrategyV2"
import { Deposit } from "../generated/schema";
import { defineProtocol, defineInputToken } from "./utils/initial";
import { ZERO_BIGDECIMAL } from "./utils/constants";
import { calculatePriceInUSD } from "./helpers/calculators";

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

export function handleAllowDepositor(event: AllowDepositor): void {}

export function handleApproval(event: Approval): void {}

export function handleDepositsEnabled(event: DepositsEnabled): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleRecovered(event: Recovered): void {}

export function handleReinvest(event: Reinvest): void {}

export function handleRemoveDepositor(event: RemoveDepositor): void {}

export function handleTransfer(event: Transfer): void {}

export function handleUpdateAdminFee(event: UpdateAdminFee): void {}

export function handleUpdateDevAddr(event: UpdateDevAddr): void {}

export function handleUpdateDevFee(event: UpdateDevFee): void {}

export function handleUpdateMaxTokensToDepositWithoutReinvest(
  event: UpdateMaxTokensToDepositWithoutReinvest
): void {}

export function handleUpdateMinTokensToReinvest(
  event: UpdateMinTokensToReinvest
): void {}

export function handleUpdateReinvestReward(event: UpdateReinvestReward): void {}

export function handleWithdraw(event: Withdraw): void {}
