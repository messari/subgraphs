import { BigDecimal, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Harvest,
  SetPerformanceFeeGovernanceCall,
  SetWithdrawalFeeCall,
} from "../../generated/bimBTC/Strategy";
import { Token, Vault, VaultFee, _Strategy } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, BIGDECIMAL_ONE, MAX_FEE, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
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

export function handleHarvest(event: Harvest): void {
  const strategyAddress = event.address;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    let vault = Vault.load(strategy.vault);
    let token = Token.load(strategy.token);
    if (!vault || !token) return;

    let performanceFee = getFeePercentage(vault, VaultFeeType.PERFORMANCE_FEE);

    let tokenPrice = getOrUpdateTokenPrice(vault, token, event.block);
    let tokenDecimals = BigDecimal.fromString(token.decimals.toString());

    log.warning("[BADGER] harvest - vault {} token {} strategy {} price {}", [
      vault.id,
      token.id,
      strategy.id,
      tokenPrice.toString(),
    ]);

    let supplySideRewardEarned = event.params.harvested
      .toBigDecimal()
      .times(BIGDECIMAL_ONE.minus(performanceFee.div(BIGDECIMAL_HUNDRED)));

    const supplySideRewardEarnedUSD = supplySideRewardEarned.div(tokenDecimals).times(tokenPrice);

    let protocolSideRewardEarned = event.params.harvested
      .toBigDecimal()
      .times(performanceFee)
      .div(BIGDECIMAL_HUNDRED);

    const protocolSideRewardEarnedUSD = protocolSideRewardEarned
      .div(tokenDecimals)
      .times(tokenPrice);

    const totalRevenueUSD = supplySideRewardEarnedUSD.plus(protocolSideRewardEarnedUSD);

    updateFinancialsAfterRewardAdded(
      event.block,
      totalRevenueUSD,
      supplySideRewardEarnedUSD,
      protocolSideRewardEarnedUSD,
    );
  }
}

export function updateFinancialsAfterRewardAdded(
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
