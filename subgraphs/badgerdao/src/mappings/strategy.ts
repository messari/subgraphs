import { Address, BigDecimal, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Harvest,
  SetPerformanceFeeGovernanceCall,
  SetWithdrawalFeeCall,
  TreeDistribution,
} from "../../generated/bimBTC/Strategy";
import { Token, Vault, VaultFee, _Strategy } from "../../generated/schema";
import {
  BADGER_TOKEN,
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGINT_TEN,
  MAX_FEE,
  VaultFeeType,
} from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getOrCreateToken } from "../entities/Token";
import { getFeePercentage } from "../entities/Vault";
import { enumToPrefix } from "../utils/strings";
import { getOrUpdateTokenPrice } from "./price";

export function handlePerformanceFee(call: SetPerformanceFeeGovernanceCall): void {
  const strategyAddress = call.to;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    let vaultAddress = strategy.vault;
    let performanceFeeId = enumToPrefix(VaultFeeType.PERFORMANCE_FEE).concat(vaultAddress);

    let performanceFee = new VaultFee(performanceFeeId);
    performanceFee.feeType = VaultFeeType.PERFORMANCE_FEE;
    performanceFee.feePercentage = call.inputs._performanceFeeGovernance
      .toBigDecimal()
      .div(MAX_FEE)
      .times(BIGDECIMAL_HUNDRED);
    performanceFee.save();
  }
}

export function handleWithdrawalFee(call: SetWithdrawalFeeCall): void {
  const strategyAddress = call.to;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    let vaultAddress = strategy.vault;
    let withdrawFeeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE).concat(vaultAddress);

    let withdrawFee = new VaultFee(withdrawFeeId);
    withdrawFee.feeType = VaultFeeType.WITHDRAWAL_FEE;
    withdrawFee.feePercentage = call.inputs._withdrawalFee
      .toBigDecimal()
      .div(MAX_FEE)
      .times(BIGDECIMAL_HUNDRED);
    withdrawFee.save();
  }
}

export function handleRewards(event: TreeDistribution): void {
  const strategyAddress = event.address;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    let vault = Vault.load(strategy.vault);
    let rewardToken = getOrCreateToken(BADGER_TOKEN);

    if (!vault) return;

    let tokenDecimals = BIGINT_TEN.pow(rewardToken.decimals as u8);
    let tokenPrice = getOrUpdateTokenPrice(vault, rewardToken, event.block);

    log.warning("[REWARD] vault {} amount {} tokenPrice {} block {}", [
      vault.id,
      event.params.amount.toString(),
      tokenPrice.toString(),
      event.params.blockNumber.toString(),
    ]);

    vault.rewardTokens = [rewardToken.id];
    vault.rewardTokenEmissionsAmount = [
      vault.rewardTokenEmissionsAmount![0].plus(event.params.amount),
    ];
    vault.rewardTokenEmissionsUSD = [
      vault
        .rewardTokenEmissionsAmount![0].toBigDecimal()
        .div(tokenDecimals.toBigDecimal())
        .times(tokenPrice),
    ];
    vault.save();
  }
}

export function handleHarvest(event: Harvest): void {
  const strategyAddress = event.address;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    if (
      Address.fromString(strategy.vault) ==
      Address.fromString("0x7e7e112a68d8d2e221e11047a72ffc1065c38e1a")
    ) {
      return;
    }

    let vault = Vault.load(strategy.vault);
    let token = Token.load(strategy.token);
    if (!vault || !token) return;

    let performanceFee = getFeePercentage(vault, VaultFeeType.PERFORMANCE_FEE);
    let tokenPrice = getOrUpdateTokenPrice(vault, token, event.block);
    let tokenDecimals = BIGINT_TEN.pow(token.decimals as u8);

    log.warning("[BADGER] harvest - vault {} token {} strategy {} harvested {} price {}", [
      vault.id,
      token.id,
      strategy.id,
      event.params.harvested.toString(),
      tokenPrice.toString(),
    ]);

    const supplySideRewardEarned = event.params.harvested
      .toBigDecimal()
      .times(BIGDECIMAL_ONE.minus(performanceFee.div(BIGDECIMAL_HUNDRED)));
    const supplySideRewardEarnedUSD = supplySideRewardEarned
      .div(tokenDecimals.toBigDecimal())
      .times(tokenPrice);

    const protocolSideRewardEarned = event.params.harvested
      .toBigDecimal()
      .times(performanceFee)
      .div(BIGDECIMAL_HUNDRED);
    const protocolSideRewardEarnedUSD = protocolSideRewardEarned
      .div(tokenDecimals.toBigDecimal())
      .times(tokenPrice);

    const totalRevenueUSD = supplySideRewardEarnedUSD.plus(protocolSideRewardEarnedUSD);

    updateFinancials(
      event.block,
      totalRevenueUSD,
      supplySideRewardEarnedUSD,
      protocolSideRewardEarnedUSD,
    );
  }
}

export function updateFinancials(
  block: ethereum.Block,
  totalRevenueUSD: BigDecimal,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal,
): void {
  const financialMetrics = getOrCreateFinancialsDailySnapshot(block);
  const protocol = getOrCreateProtocol();

  // TotalRevenueUSD Metrics
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    totalRevenueUSD,
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

  // SupplySideRevenueUSD Metrics
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD,
  );
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD,
  );
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;

  // ProtocolSideRevenueUSD Metrics
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD,
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD,
  );
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();
  protocol.save();
}
