import * as constants from "../common/constants";
import {
  VaultFee,
  Vault as VaultStore,
  _Strategy as StrategyStore,
  Token,
} from "../../generated/schema";
import {
  SetWithdrawalFeeCall,
  SetPerformanceFeeCall,
  Harvested as HarvestedEvent,
} from "../../generated/templates/Strategy/Strategy";

import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";

export function handleHarvested(event: HarvestedEvent): void {
  const strategyAddress = event.address;
  const strategy = StrategyStore.load(strategyAddress.toHexString());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;
    const vault = VaultStore.load(vaultAddress.toHexString());

    let financialMetricsId: i64 =
      event.block.timestamp.toI64() / constants.SECONDS_PER_DAY;
    const financialMetrics = utils.getOrCreateFinancialSnapshots(
      financialMetricsId.toString()
    );

    // load performance fee and get the fees percentage
    let performanceFee = utils.getFeePercentage(
      vaultAddress.toHexString(),
      constants.VaultFeeType.PERFORMANCE_FEE
    );

    let originalBalance = vault!.inputTokenBalances[0];

    let wantEarned = event.params.wantEarned
      .times(
        constants.BIGINT_HUNDRED.minus(
          BigInt.fromString(performanceFee.toString())
        )
      )
      .div(constants.BIGINT_HUNDRED);

    let protocolEarnings = event.params.wantEarned
      .toBigDecimal()
      .times(performanceFee)
      .div(constants.BIGDECIMAL_HUNDRED);

    let protocolSideRevenueUSD = protocolEarnings.plus(
      financialMetrics.feesUSD
    );

    let inputToken = Token.load(vault!.inputTokens[0]);
    let inputTokenAddress = Address.fromString(vault!.inputTokens[0]);
    let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken!.decimals as u8);
    let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);

    financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(
      inputTokenPrice.usdPrice
        .times(wantEarned.toBigDecimal())
        .div(inputTokenDecimals.toBigDecimal())
        .div(inputTokenPrice.decimals.toBigDecimal())
    );

    financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );

    vault!.inputTokenBalances = [
      vault!.inputTokenBalances[0].plus(
        BigInt.fromString(wantEarned.toString())
      ),
    ];

    financialMetrics.save();
    vault!.save();

    log.warning(
      "[handleHarvested]\n TxHash: {}, eventAddress: {}, wantEarned: {}, inputTokenPrice: {}, supplySideRevenueUSD: {}, protocolSideRevenueUSD: {}",
      [
        event.transaction.hash.toHexString(),
        event.address.toHexString(),
        wantEarned.toString(),
        inputTokenPrice.usdPrice.toString(),
        financialMetrics.supplySideRevenueUSD.toString(),
        financialMetrics.protocolSideRevenueUSD.toString(),
      ]
    );
  }
}

export function handleSetPerformanceFee(call: SetPerformanceFeeCall): void {
  const strategyAddress = call.to;
  const strategy = StrategyStore.load(strategyAddress.toHexString());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;

    let performanceFeeId = "performance-fee-" + vaultAddress.toHexString();
    const performanceFee = VaultFee.load(performanceFeeId);

    performanceFee!.feePercentage = call.inputs._performanceFee
      .div(BigInt.fromI32(100))
      .toBigDecimal();

    performanceFee!.save();

    log.warning("[setPerformanceFee]\n TxHash: {}, newPerformanceFee: {}", [
      call.transaction.hash.toHexString(),
      call.inputs._performanceFee.toString(),
    ]);
  }
}

export function handleSetWithdrawalFee(call: SetWithdrawalFeeCall): void {
  const strategyAddress = call.to;
  const strategy = StrategyStore.load(strategyAddress.toHexString());

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;

    let withdrawalFeeId = "withdrawal-fee-" + vaultAddress.toHexString();
    const withdrawalFee = VaultFee.load(withdrawalFeeId);

    withdrawalFee!.feePercentage = call.inputs._withdrawalFee
      .div(BigInt.fromI32(100))
      .toBigDecimal();

    withdrawalFee!.save();

    log.warning("[setWithdrawalFee]\n TxHash: {}, newPerformanceFee: {}", [
      call.transaction.hash.toHexString(),
      call.inputs._withdrawalFee.toString(),
    ]);
  }
}
