import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Account, DailyActiveAccount, Vault } from "../../generated/schema";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUserSnapshot,
  getOrCreateVaultDailySnapshot,
} from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getOrCreateToken } from "../entities/Token";
import { getDay } from "../utils/numbers";
import { getUSDPriceOfToken } from "./price";

export function updateUsageMetrics(event: ethereum.Event): void {
  let block = event.block;
  let user = event.transaction.from;

  let account = Account.load(user.toHex());
  let metrics = getOrCreateUserSnapshot(block);
  let protocol = getOrCreateProtocol();
  let day = getDay(block.timestamp);

  metrics.blockNumber = block.number;
  metrics.timestamp = block.timestamp;
  metrics.dailyTransactionCount = metrics.dailyTransactionCount + 1;

  // is a new user
  if (account == null) {
    account = new Account(user.toHex());
    account.save();

    metrics.totalUniqueUsers = metrics.totalUniqueUsers + 1;

    // update users on protocol
    protocol.totalUniqueUsers = protocol.totalUniqueUsers + 1;
    protocol.save();
  }

  let dailyAccountId = day
    .toString()
    .concat("-")
    .concat(user.toHex());
  let dailyActiveAccount = DailyActiveAccount.load(dailyAccountId);

  // is a new user of the day
  if (dailyActiveAccount == null) {
    dailyActiveAccount = new DailyActiveAccount(dailyAccountId);
    dailyActiveAccount.save();

    metrics.activeUsers = metrics.activeUsers + 1;
  }

  metrics.save();
}

export function updateFinancialMetrics(vault: Vault, inputTokenAmount: BigInt, block: ethereum.Block): void {
  let metrics = getOrCreateFinancialsDailySnapshot(block);

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUSDPriceOfToken(inputToken);
  let inputTokenAmountNormalized = inputTokenAmount.toBigDecimal().div(inputTokenDecimals.toBigDecimal());

  metrics.timestamp = block.timestamp;
  metrics.blockNumber = block.number;
  metrics.totalVolumeUSD = metrics.totalVolumeUSD.plus(inputTokenPrice.times(inputTokenAmountNormalized));
  metrics.totalValueLockedUSD = vault.totalValueLockedUSD;

  metrics.save();
}

export function updateProtocolMetrics(amountUSD: BigDecimal, isDeposit: boolean): void {
  let protocol = getOrCreateProtocol();

  protocol.totalVolumeUSD = protocol.totalVolumeUSD.plus(amountUSD);
  protocol.totalValueLockedUSD = isDeposit
    ? protocol.totalValueLockedUSD.plus(amountUSD)
    : protocol.totalValueLockedUSD.minus(amountUSD);

  protocol.save();
}

export function updateVaultMetrics(vault: Vault, block: ethereum.Block): void {
  let metrics = getOrCreateVaultDailySnapshot(Address.fromString(vault.id), block);

  metrics.vault = vault.id;
  metrics.totalValueLockedUSD = vault.totalValueLockedUSD;
  metrics.totalVolumeUSD = vault.totalVolumeUSD;
  metrics.inputTokenBalances = vault.inputTokenBalances;
  metrics.outputTokenSupply = vault.outputTokenSupply;
  metrics.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  metrics.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  metrics.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;
  metrics.blockNumber = block.number;
  metrics.timestamp = block.timestamp;

  metrics.save();
}
