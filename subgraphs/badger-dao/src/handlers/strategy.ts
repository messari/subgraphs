import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  Harvest,
  SetPerformanceFeeGovernanceCall,
  SetWithdrawalFeeCall,
} from "../../generated/badger-wbtc/BadgerStrategy";
import { VaultFee, _Strategy } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, BIGINT_HUNDRED, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateVault } from "../entities/Vault";
import { getDay } from "../utils/numbers";
import { enumToPrefix } from "../utils/strings";
import { getFeePercentange } from "./common";
import { getUsdPriceOfToken } from "./price";

export function handleHarvested(event: Harvest): void {
  const strategyAddress = event.address;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;
    const vault = getOrCreateVault(Address.fromString(vaultAddress), event.block);
    const metrics = getOrCreateFinancialsDailySnapshot(getDay(event.block.timestamp));

    let performanceFee = getFeePercentange(vault, VaultFeeType.PERFORMANCE_FEE);
    let wantEarned = event.params.harvested.times(BIGINT_HUNDRED.minus(BigInt.fromString(performanceFee.toString())));
    let protocolEarnings = event.params.harvested
      .toBigDecimal()
      .times(performanceFee)
      .div(BIGDECIMAL_HUNDRED);
    let protocolSideRevenueUSD = protocolEarnings.plus(metrics.feesUSD);

    let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
    let inputToken = getOrCreateToken(inputTokenAddress);
    let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
    let inputTokenPrice = getUsdPriceOfToken(inputTokenAddress);

    metrics.supplySideRevenueUSD = metrics.supplySideRevenueUSD
      .plus(inputTokenPrice.times(wantEarned.toBigDecimal()))
      .div(inputTokenDecimals.toBigDecimal());

    metrics.protocolSideRevenueUSD = metrics.protocolSideRevenueUSD.plus(protocolSideRevenueUSD);

    vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(wantEarned)];

    metrics.save();
    vault.save();
  }
}

export function handleSetPerformanceFee(call: SetPerformanceFeeGovernanceCall): void {
  const strategyAddress = call.to;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;
    const performanceId = enumToPrefix(VaultFeeType.PERFORMANCE_FEE).concat(vaultAddress);
    const performanceFee = VaultFee.load(performanceId);

    performanceFee!.feePercentage = call.inputs._performanceFeeGovernance.div(BIGINT_HUNDRED).toBigDecimal();
    performanceFee!.save();

    log.info("[BADGER] performance fee : vault {}, fee {}", [
      vaultAddress,
      call.inputs._performanceFeeGovernance.toString(),
    ]);
  }
}

export function handleSetWithdrawalFee(call: SetWithdrawalFeeCall): void {
  const strategyAddress = call.to;
  const strategy = _Strategy.load(strategyAddress.toHex());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;
    const withdrawFeeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE).concat(vaultAddress);
    const withdrawFee = VaultFee.load(withdrawFeeId);

    withdrawFee!.feePercentage = call.inputs._withdrawalFee.div(BIGINT_HUNDRED).toBigDecimal();
    withdrawFee!.save();

    log.info("[BADGER] withdrawal fee : vault {}, fee {}", [vaultAddress, call.inputs._withdrawalFee.toString()]);
  }
}
