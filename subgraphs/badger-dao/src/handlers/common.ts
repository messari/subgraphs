import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Token, Vault, VaultDailySnapshot, VaultFee, YieldAggregator, _User as User } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_HUNDRED, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot, getOrCreateUserSnapshot } from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getDay, normalizedUsdcPrice } from "../utils/numbers";
import { getPriceOfCurveLpToken, getPriceOfStakedTokens } from "./price";

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

export function updateVault(vault: Vault, token: Token, inputTokenAmount: BigInt, tokenPrice: BigInt): void {
  let index = vault.inputTokens.indexOf(token.id);
  let balance = BigInt.zero();

  if (index === -1) {
    vault.inputTokens = vault.inputTokens.concat([token.id]);
    vault.inputTokenBalances = vault.inputTokenBalances.concat([inputTokenAmount]);
    balance = inputTokenAmount;
  }

  if (index !== -1) {
    let balances = vault.inputTokenBalances;
    balances[index] = balances[index].plus(inputTokenAmount);

    vault.inputTokenBalances = balances;
    balance = balances[index];
  }

  vault.outputTokenPriceUSD = normalizedUsdcPrice(
    getPriceOfStakedTokens(Address.fromString(vault.id), Address.fromString(token.id), BigInt.fromI32(token.decimals)),
  ).toBigDecimal();
  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(tokenPrice.toBigDecimal());
  vault.totalValueLockedUSD = normalizedUsdcPrice(
    getPriceOfCurveLpToken(Address.fromString(token.id), balance, BigInt.fromI32(token.decimals)),
  ).toBigDecimal();

  vault.save();
}

export function updateFinancialMetrics(
  protocol: YieldAggregator,
  vault: Vault,
  token: Token,
  tokenPrice: BigInt,
  inputTokenAmount: BigInt,
  block: ethereum.Block,
): void {
  let metrics = getOrCreateFinancialsDailySnapshot(getDay(block.timestamp));
  if (metrics.blockNumber.equals(BigInt.zero())) {
    metrics.timestamp = block.timestamp;
    metrics.blockNumber = block.number;
  }

  let feePercentage = getFeePercentange(vault, VaultFeeType.WITHDRAWAL_FEE);
  let feeAmount = tokenPrice
    .times(BigInt.fromString(feePercentage.toString()))
    .div(BIGINT_HUNDRED)
    .toBigDecimal();
  let valueLockedUSD = normalizedUsdcPrice(
    getPriceOfCurveLpToken(Address.fromString(token.id), inputTokenAmount, BigInt.fromI32(token.decimals)),
  ).toBigDecimal();

  metrics.feesUSD = metrics.feesUSD.plus(feeAmount);
  metrics.totalVolumeUSD = metrics.totalVolumeUSD.plus(tokenPrice.toBigDecimal());
  metrics.totalValueLockedUSD = valueLockedUSD;
  metrics.protocol = protocol.id;
  metrics.save();

  // updating protocol
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(valueLockedUSD);
  protocol.save();
}

export function updateVaultMetrics(
  vault: Vault,
  token: Token,
  metrics: VaultDailySnapshot,
  inputTokenAmount: BigInt,
  tokenPrice: BigInt,
  isDeposit: bool,
  block: ethereum.Block,
): void {
  let index = vault.inputTokens.indexOf(token.id);
  let balances = metrics.inputTokenBalances;
  let currentBalance = balances[index];

  if (metrics.blockNumber.equals(BigInt.zero())) {
    metrics.timestamp = block.timestamp;
    metrics.blockNumber = block.number;
  }

  if (isDeposit) {
    currentBalance = currentBalance.plus(inputTokenAmount);
  } else {
    currentBalance = currentBalance.minus(inputTokenAmount);
  }

  balances[index] = currentBalance;
  metrics.inputTokenBalances = balances;

  metrics.outputTokenPriceUSD = normalizedUsdcPrice(
    getPriceOfStakedTokens(Address.fromString(vault.id), Address.fromString(token.id), BigInt.fromI32(token.decimals)),
  ).toBigDecimal();
  metrics.totalVolumeUSD = vault.totalVolumeUSD.plus(tokenPrice.toBigDecimal());
  metrics.totalValueLockedUSD = normalizedUsdcPrice(
    getPriceOfCurveLpToken(Address.fromString(token.id), currentBalance, BigInt.fromI32(token.decimals)),
  ).toBigDecimal();
  metrics.save();
}

function getFeePercentange(vault: Vault, feeType: string): BigDecimal {
  let feePercentage = BIGDECIMAL_ZERO;

  for (let i = 0; i < vault.fees.length; i++) {
    let fee = VaultFee.load(vault.fees[i]);

    if (fee && fee.feeType === feeType) {
      return fee.feePercentage;
    }
  }

  return feePercentage;
}
