import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, HourlyActiveAccount, Vault } from "../../generated/schema";
import { BIGDECIMAL_ZERO } from "../constant";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateHourlyDailySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
} from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getDay, getHour } from "../utils/numbers";

function updateUsageMetrics(event: ethereum.Event, isDeposit: bool): void {
  let dailyMetrics = getOrCreateUsageMetricDailySnapshot(event.block);
  let hourlyMetrics = getOrCreateHourlyDailySnapshot(event.block);
  let protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  dailyMetrics.blockNumber = event.block.number;
  dailyMetrics.timestamp = event.block.timestamp;
  dailyMetrics.dailyTransactionCount += 1;

  hourlyMetrics.blockNumber = event.block.number;
  hourlyMetrics.timestamp = event.block.timestamp;
  hourlyMetrics.hourlyTransactionCount += 1;

  if (isDeposit) {
    dailyMetrics.dailyDepositCount += 1;
    hourlyMetrics.hourlyDepositCount += 1;
  } else {
    dailyMetrics.dailyWithdrawCount += 1;
    hourlyMetrics.hourlyWithdrawCount += 1;
  }

  let accountId = event.transaction.from.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  let dayActiveAccountId = event.transaction.from
    .toHexString()
    .concat("-")
    .concat(getDay(event.block.timestamp).toString());
  let activeAccount = ActiveAccount.load(dayActiveAccountId);
  if (!activeAccount) {
    activeAccount = new ActiveAccount(dayActiveAccountId);
    activeAccount.save();

    dailyMetrics.dailyActiveUsers += 1;
  }

  let hourActiveAccountId = event.transaction.from
    .toHexString()
    .concat("-")
    .concat(getHour(event.block.timestamp).toString());
  let hourlyActiveAccount = HourlyActiveAccount.load(hourActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new HourlyActiveAccount(hourActiveAccountId);
    hourlyActiveAccount.save();

    hourlyMetrics.hourlyActiveUsers += 1;
  }

  hourlyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  hourlyMetrics.save();

  dailyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailyMetrics.save();
}

function updateProtocolMetrics(block: ethereum.Block): void {
  let protocol = getOrCreateProtocol();
  let totalValueLockedUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._vaultIds.length; i++) {
    let vaultId = protocol._vaultIds[i];
    let vault = Vault.load(vaultId);

    if (vault) {
      totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
    }
  }

  let financial = getOrCreateFinancialsDailySnapshot(block);
  financial.totalValueLockedUSD = totalValueLockedUSD;
  financial.save();

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

function updateVaultMetrics(vault: Vault, block: ethereum.Block): void {
  let daily = getOrCreateVaultDailySnapshot(Address.fromString(vault.id), block);
  daily.vault = vault.id;
  daily.totalValueLockedUSD = vault.totalValueLockedUSD;
  daily.inputTokenBalance = vault.inputTokenBalance;
  daily.outputTokenSupply = vault.outputTokenSupply;
  daily.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  daily.pricePerShare = vault.pricePerShare;
  daily.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  daily.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  daily.blockNumber = block.number;
  daily.timestamp = block.timestamp;
  daily.save();

  let hourly = getOrCreateVaultHourlySnapshot(Address.fromString(vault.id), block);
  hourly.vault = vault.id;
  hourly.totalValueLockedUSD = vault.totalValueLockedUSD;
  hourly.inputTokenBalance = vault.inputTokenBalance;
  hourly.outputTokenSupply = vault.outputTokenSupply;
  hourly.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  hourly.pricePerShare = vault.pricePerShare;
  hourly.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  hourly.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  hourly.blockNumber = block.number;
  hourly.timestamp = block.timestamp;
  hourly.save();
}

export function updateAllMetrics(event: ethereum.Event, vault: Vault, isDeposit: bool): void {
  updateUsageMetrics(event, isDeposit);
  updateProtocolMetrics(event.block); // updates TVL
  updateVaultMetrics(vault, event.block);
}
