import {
  YakStrategyV2,
  Deposit as DepositEvent,
  Reinvest,
  UpdateAdminFee,
  UpdateDevFee,
  UpdateReinvestReward,
  Withdraw as WithdrawEvent
} from "../generated/YakStrategyV2/YakStrategyV2"
import { ZERO_BIGDECIMAL } from "./helpers/constants";
import { updateDailyOrHourlyEntities } from "./updaters/dailyOrHourlyEntitiesUpdater";
import { updateRewardParametersOfDailyOrHourlyEntities } from "./updaters/rewardParametersEntitiesUpdater";
import { updateVaultFee } from "./updaters/vaultFeeUpdater";
import { initDeposit } from "./initializers/depositInitializer";
import { initWithdraw } from "./initializers/withdrawInitializer";
import { initProtocol } from "./initializers/protocolInitializer";
import { initInputToken } from "./initializers/inputTokenInitializer";
import { initVault } from "./initializers/vaultInitializer";
import { initUsageMetricsDailySnapshot } from "./initializers/usageMetricsDailySnapshotInitializer";
import { initUsageMetricsHourlySnapshot } from "./initializers/usageMetricsHourlySnapshotInitializer";
import { calculatePriceInUSD } from "./calculators/priceInUSDCalculator";

export function handleDeposit(event: DepositEvent): void {
  const deposit = initDeposit(event);

  const contractAddress = event.address;
  const protocol = initProtocol(contractAddress);
  deposit.protocol = protocol.id;

  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  if (yakStrategyV2Contract.try_depositToken().reverted) {
    deposit.asset = "";
    deposit.amountUSD = ZERO_BIGDECIMAL;
  } else {
    const inputTokenAddress = yakStrategyV2Contract.depositToken();
    const inputToken = initInputToken(inputTokenAddress, event.block.number);

    deposit.asset = inputToken.id;
    deposit.amountUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), event.transaction.value);
  }

  updateDailyOrHourlyEntities(event.address, event.block.timestamp, event.block.number);

  const usageMetricsDailySnapshotEntity = initUsageMetricsDailySnapshot(event.block.timestamp, event.block.number, event.address);
  usageMetricsDailySnapshotEntity.dailyDepositCount = usageMetricsDailySnapshotEntity.dailyDepositCount + 1;
  usageMetricsDailySnapshotEntity.save();

  const vault = initVault(contractAddress, event.block.timestamp, event.block.number);
  deposit.vault = vault.id;

  const usageMetricsHourlySnapshotEntity = initUsageMetricsHourlySnapshot(event.block.timestamp, event.block.number, event.address);
  usageMetricsHourlySnapshotEntity.hourlyDepositCount = usageMetricsHourlySnapshotEntity.hourlyDepositCount + 1;
  usageMetricsHourlySnapshotEntity.save();

  deposit.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  let withdraw = initWithdraw(event);

  const contractAddress = event.address;
  const yakStrategyV2Contract = YakStrategyV2.bind(contractAddress);
  const protocol = initProtocol(contractAddress);
  withdraw.protocol = protocol.id;
  const inputTokenAddress = yakStrategyV2Contract.depositToken();
  const inputToken = initInputToken(inputTokenAddress, event.block.number);

  withdraw.asset = inputToken.id;
  if (yakStrategyV2Contract.try_depositToken().reverted) {
    withdraw.amountUSD = ZERO_BIGDECIMAL;
  } else {
    withdraw.amountUSD = calculatePriceInUSD(yakStrategyV2Contract.depositToken(), event.transaction.value);
  }

  updateDailyOrHourlyEntities(event.address, event.block.timestamp, event.block.number)

  const usageMetricsDailySnapshotEntity = initUsageMetricsDailySnapshot(event.block.timestamp, event.block.number, event.address);
  usageMetricsDailySnapshotEntity.dailyWithdrawCount = usageMetricsDailySnapshotEntity.dailyWithdrawCount + 1;
  usageMetricsDailySnapshotEntity.save();

  const vault = initVault(contractAddress, event.block.timestamp, event.block.number);
  withdraw.vault = vault.id;

  const usageMetricsHourlySnapshotEntity = initUsageMetricsHourlySnapshot(event.block.timestamp, event.block.number, event.address);
  usageMetricsHourlySnapshotEntity.hourlyWithdrawCount = usageMetricsHourlySnapshotEntity.hourlyWithdrawCount + 1;
  usageMetricsHourlySnapshotEntity.save();

  withdraw.save();
}

export function handleReinvest(event: Reinvest): void {
  updateDailyOrHourlyEntities(event.address, event.block.timestamp, event.block.number);
  updateRewardParametersOfDailyOrHourlyEntities(
    event.address,
    event.block.timestamp,
    event.block.number,
    event.params.newTotalSupply)
}

export function handleUpdateAdminFee(event: UpdateAdminFee): void {
  updateVaultFee(event.address, event.params.newValue, "-adminFee");
}

export function handleUpdateDevFee(event: UpdateDevFee): void {
  updateVaultFee(event.address, event.params.newValue, "-developerFee");
}

export function handleUpdateReinvestReward(event: UpdateReinvestReward): void {
  updateVaultFee(event.address, event.params.newValue, "-reinvestorFee");
}

