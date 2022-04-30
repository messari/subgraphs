import * as utils from "../common/utils";
import * as constants from "../common/constants";
import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { getUsdPricePerToken } from "../Prices";
import { getPriceOfOutputTokens } from "./Price";
import {
  getOrCreateFinancialDailySnapshots,
  getOrCreateStrategy,
} from "../common/initializers";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";
import { Token, _Strategy, Vault as VaultStore } from "../../generated/schema";
import { Strategy as StrategyContract } from "../../generated/templates/Vault/Strategy";

export function getStrategyInfo(
  strategyAddress: Address,
  vaultContract: VaultContract
): BigInt[] {
  let performanceFee: BigInt = constants.BIGINT_ZERO;
  let lastReport: BigInt = constants.BIGINT_ZERO;

  let strategyData_v1 = vaultContract.try_strategies_v1(strategyAddress);
  if (strategyData_v1.reverted) {
    let strategyData_v2 = vaultContract.try_strategies_v2(strategyAddress);

    if (strategyData_v2.reverted) {
      lastReport = utils.readValue<BigInt>(
        vaultContract.try_lastReport(),
        constants.BIGINT_ZERO
      );

      return [constants.DEFAULT_PERFORMANCE_FEE, lastReport];
    } else {
      performanceFee = strategyData_v2.value.value0;
      lastReport = strategyData_v2.value.value5;
    }
  } else {
    performanceFee = strategyData_v1.value.value0;
    lastReport = strategyData_v1.value.value4;
  }

  return [performanceFee, lastReport];
}

export function calculateManagementFee(
  vaultContract: VaultContract,
  strategyStore: _Strategy,
  lastReport: BigInt,
  delegatedAssets: BigInt,
  inputTokenDecimals: BigInt,
  totalDebt: BigInt
): BigDecimal {
  let managementFee = utils.readValue<BigInt>(
    vaultContract.try_managementFee(),
    constants.DEFAULT_MANAGEMENT_FEE
  );

  return totalDebt
    .minus(delegatedAssets)
    .times(lastReport.minus(strategyStore.lastReport))
    .times(managementFee)
    .div(constants.MAX_BPS)
    .div(constants.SECONDS_PER_YEAR)
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal());
}

export function calculatePerformanceFee(
  vaultContract: VaultContract,
  inputTokenDecimals: BigInt,
  gain: BigInt
): BigDecimal {
  let performanceFeeValue = utils.readValue<BigInt>(
    vaultContract.try_performanceFee(),
    constants.DEFAULT_PERFORMANCE_FEE
  );

  return gain
    .times(performanceFeeValue)
    .div(constants.MAX_BPS)
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal());
}

export function calculateStrategyFee(
  inputTokenDecimals: BigInt,
  strategyPerformanceFee: BigInt,
  gain: BigInt
): BigDecimal {
  return gain
    .times(strategyPerformanceFee)
    .div(constants.MAX_BPS)
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal());
}

export function strategyReported(
  event: ethereum.Event,
  vaultAddress: Address,
  strategyAddress: Address,
  gain: BigInt,
  debtAdded: BigInt,
  debtPaid: BigInt,
  totalDebt: BigInt
): void {
  if (gain == constants.BIGINT_ZERO) {
    return;
  }

  const vaultStore = VaultStore.load(vaultAddress.toHexString());
  const vaultContract = VaultContract.bind(vaultAddress);

  const strategyStore = getOrCreateStrategy(
    vaultAddress,
    strategyAddress,
    constants.BIGINT_ZERO
  );
  const strategyContract = StrategyContract.bind(strategyAddress);

  let strategyInfo = getStrategyInfo(strategyAddress, vaultContract);
  let strategyPerformanceFee = strategyInfo[0];
  let lastReport = strategyInfo[1];

  let delegatedAssets = utils.readValue<BigInt>(
    strategyContract.try_delegatedAssets(),
    constants.BIGINT_ZERO
  );

  let inputToken = Token.load(vaultStore!.inputToken);
  let inputTokenAddress = Address.fromString(vaultStore!.inputToken);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken!.decimals as u8);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);

  let totalSupply = vaultContract.totalSupply();
  let totalSharesMinted = totalSupply
    .minus(vaultStore!.outputTokenSupply)
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal());

  const managementFee = calculateManagementFee(
    vaultContract,
    strategyStore,
    lastReport,
    delegatedAssets,
    inputTokenDecimals,
    totalDebt
  );

  const performanceFee = calculatePerformanceFee(
    vaultContract,
    inputTokenDecimals,
    gain
  );

  const strategistFee = calculateStrategyFee(
    inputTokenDecimals,
    strategyPerformanceFee,
    gain
  );

  let totalFee = managementFee.plus(performanceFee).plus(strategistFee);

  let strategistReward = constants.BIGDECIMAL_ZERO;
  if (strategistFee > constants.BIGDECIMAL_ZERO) {
    strategistReward = strategistFee.times(totalSharesMinted).div(totalFee);
  }

  let gainUSD = inputTokenPrice.usdPrice
    .times(gain.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimalsBaseTen);

  let outputTokenPriceUsd = getPriceOfOutputTokens(
    Address.fromString(vaultStore!.id),
    inputTokenAddress,
    inputTokenDecimals.toBigDecimal()
  );

  let protocolEarnings = totalSharesMinted.minus(strategistReward);
  let protocolEarningsUSD = protocolEarnings.times(outputTokenPriceUsd);

  const financialMetrics = getOrCreateFinancialDailySnapshots(event.block);

  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    outputTokenPriceUsd.times(protocolEarningsUSD)
  );
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    gainUSD
  );
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    gainUSD.plus(outputTokenPriceUsd.times(totalSharesMinted))
  );
  financialMetrics.save();

  vaultStore!.inputTokenBalance = vaultStore!.inputTokenBalance.plus(gain);
  vaultStore!.outputTokenSupply = totalSupply;
  vaultStore!.save();

  strategyStore.totalDebt = totalDebt
  strategyStore.lastReport = lastReport;
  strategyStore.save();

  log.warning(
    "[StrategyReported] vaultAddress: {}, strategyAddress: {}, totalSharesMinted: {}, outputTokenPrice: {}, \
    strategistReward: {}, inputTokenBalances: {}, outputTokenSupply: {}, totalDebt: {}, lastReport: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      totalSharesMinted.toString(),
      outputTokenPriceUsd.toString(),
      strategistReward.toString(),
      vaultStore!.inputTokenBalance.toString(),
      vaultStore!.outputTokenSupply.toString(),
      strategyStore.totalDebt.toString(),
      strategyStore.lastReport.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
