import { Address, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, Vault } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../constant";
import {
  getOrCreateHourlyDailySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
} from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getDay } from "../utils/numbers";

function updateUsageMetrics(call: ethereum.Call, isDeposit: bool): void {
  let dailyMetrics = getOrCreateUsageMetricDailySnapshot(call.block);
  let hourlyMetrics = getOrCreateHourlyDailySnapshot(call.block);
  let protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  dailyMetrics.blockNumber = call.block.number;
  dailyMetrics.timestamp = call.block.timestamp;
  dailyMetrics.dailyTransactionCount += 1;

  hourlyMetrics.blockNumber = call.block.number;
  hourlyMetrics.timestamp = call.block.timestamp;
  hourlyMetrics.hourlyTransactionCount += 1;

  if (isDeposit) {
    dailyMetrics.dailyDepositCount += 1;
    hourlyMetrics.hourlyDepositCount += 1;
  } else {
    dailyMetrics.dailyWithdrawCount += 1;
    hourlyMetrics.hourlyWithdrawCount += 1;
  }

  let accountId = call.transaction.from.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  let activeAccountId = call.transaction.from
    .toHexString()
    .concat("-")
    .concat(getDay(call.block.timestamp).toString());
  let activeAccount = ActiveAccount.load(activeAccountId);
  if (!activeAccount) {
    activeAccount = new ActiveAccount(activeAccountId);
    activeAccount.save();

    dailyMetrics.dailyActiveUsers += 1;
    hourlyMetrics.hourlyActiveUsers += 1;
  }

  hourlyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  hourlyMetrics.save();

  dailyMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailyMetrics.save();
}

function updateProtocolMetrics(): void {
  let protocol = getOrCreateProtocol();
  let totalValueLockedUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._vaultIds.length; i++) {
    let vaultId = protocol._vaultIds[i];
    let vault = Vault.load(vaultId);

    if (vault) {
      totalValueLockedUSD = totalValueLockedUSD.plus(vault.totalValueLockedUSD);
    }
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

function updateVaultMetrics(vault: Vault, block: ethereum.Block): void {
  let daily = getOrCreateVaultDailySnapshot(Address.fromString(vault.id), block);
  daily.vault = vault.id;
  daily.totalValueLockedUSD = vault.totalValueLockedUSD;
  daily.inputTokenBalance = vault.inputTokenBalance;
  daily.outputTokenSupply = vault.outputTokenSupply || BIGINT_ZERO;
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
  hourly.outputTokenSupply = vault.outputTokenSupply || BIGINT_ZERO;
  hourly.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  hourly.pricePerShare = vault.pricePerShare;
  hourly.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  hourly.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  hourly.blockNumber = block.number;
  hourly.timestamp = block.timestamp;
  hourly.save();
}

export function updateAllMetrics(call: ethereum.Call, vault: Vault, isDeposit: bool): void {
  updateUsageMetrics(call, isDeposit);
  updateProtocolMetrics(); // updates TVL
  updateVaultMetrics(vault, call.block);
}
