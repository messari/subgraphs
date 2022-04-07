import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Vault, _User as User } from "../../generated/schema";
import { BIGINT_ZERO } from "../constant";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUserSnapshot,
  getOrCreateVaultDailySnapshot,
} from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getOrCreateToken } from "../entities/Token";
import { getDay } from "../utils/numbers";
import { getUSDPriceOfToken } from "./price";

export function updateUsageMetrics(user: User, block: ethereum.Block): void {
  let metrics = getOrCreateUserSnapshot(getDay(block.timestamp));
  let protocol = getOrCreateProtocol();
  let day = getDay(block.timestamp);

  metrics.protocol = protocol.id;
  metrics.dailyTransactionCount = metrics.dailyTransactionCount + 1;

  // no metrics yet, initialize
  if (metrics.blockNumber.equals(BigInt.zero())) {
    metrics.blockNumber = block.number;
    metrics.timestamp = block.timestamp;
  }

  // is a new user
  if (user.lastDayActive === 0) {
    user.lastDayActive = day;

    metrics.totalUniqueUsers = metrics.totalUniqueUsers + 1;
    metrics.activeUsers = metrics.activeUsers + 1;

    // update users on protocol
    protocol.totalUniqueUsers = protocol.totalUniqueUsers + 1;
    protocol.save();
  }

  // new user of the day
  else if (user.lastDayActive < day) {
    user.lastDayActive = day;

    metrics.activeUsers = metrics.activeUsers + 1;
  }

  user.save();
  metrics.save();
}

export function updateFinancialMetrics(vault: Vault, inputTokenAmount: BigInt, block: ethereum.Block): void {
  let protocol = getOrCreateProtocol();
  let metrics = getOrCreateFinancialsDailySnapshot(getDay(block.timestamp));
  if (metrics.blockNumber.equals(BigInt.zero())) {
    metrics.timestamp = block.timestamp;
    metrics.blockNumber = block.number;
  }

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUSDPriceOfToken(inputToken);
  let inputTokenAmountNormalized = inputTokenAmount.toBigDecimal().div(inputTokenDecimals.toBigDecimal());

  metrics.totalVolumeUSD = metrics.totalVolumeUSD.plus(inputTokenPrice.times(inputTokenAmountNormalized));
  metrics.totalValueLockedUSD = vault.totalValueLockedUSD;

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(inputTokenPrice.times(inputTokenAmountNormalized));

  metrics.save();
  protocol.save();
}

export function updateVaultMetrics(vault: Vault, block: ethereum.Block): void {
  let metrics = getOrCreateVaultDailySnapshot(Address.fromString(vault.id), getDay(block.timestamp));

  metrics.vault = vault.id;
  metrics.totalValueLockedUSD = vault.totalValueLockedUSD;
  metrics.totalVolumeUSD = vault.totalVolumeUSD;
  metrics.inputTokenBalances = vault.inputTokenBalances;
  metrics.outputTokenSupply = vault.outputTokenSupply;
  metrics.outputTokenPriceUSD = vault.outputTokenPriceUSD;
  metrics.rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount;
  metrics.rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD;

  if (metrics.blockNumber.equals(BIGINT_ZERO)) {
    metrics.blockNumber = block.number;
    metrics.timestamp = block.timestamp;
  }

  metrics.save();
}
