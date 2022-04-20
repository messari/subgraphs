import * as utils from "../common/utils";
import * as constants from "../common/constants";
import {
  Token,
  VaultFee,
  _Strategy,
  Vault as VaultStore,
} from "../../generated/schema";
import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { getUsdPricePerToken } from "../Prices";
import { getPriceOfStakedTokens } from "./Price";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";
import { Strategy as StrategyContract } from "../../generated/templates/Vault/Strategy";

export function createFeeType(
  feeId: string,
  feeType: string,
  try_feePercentage: ethereum.CallResult<BigInt>,
  defaultFeePercentage: BigInt
): void {
  const fees = new VaultFee(feeId);

  let feePercentage = try_feePercentage.reverted
    ? defaultFeePercentage
    : try_feePercentage.value;

  fees.feeType = feeType;
  fees.feePercentage = feePercentage
    .toBigDecimal()
    .div(BigDecimal.fromString("100"));

  fees.save();
}

export function getOrCreateStrategy(
  vaultAddress: Address,
  _strategyAddress: Address,
  performanceFee: BigInt
): _Strategy {
  let strategy = _Strategy.load(_strategyAddress.toHexString());

  if (!strategy) {
    strategy = new _Strategy(_strategyAddress.toHexString());

    strategy.totalDebt = constants.BIGINT_ZERO;
    strategy.lastReport = constants.BIGINT_ZERO;
    strategy.vaultAddress = vaultAddress;
    strategy.performanceFee = performanceFee;
  }
  return strategy;
}

export function strategyReported(
  event: ethereum.Event,
  vaultAddress: Address,
  strategyAddress: Address,
  gain: BigInt,
  debtAdded: BigInt
): void {
  const vaultStore = VaultStore.load(vaultAddress.toHexString());
  const strategyStore = getOrCreateStrategy(
    vaultAddress,
    strategyAddress,
    constants.BIGINT_ZERO
  );

  const vaultContract = VaultContract.bind(vaultAddress);
  const strategyContract = StrategyContract.bind(strategyAddress);

  let reportTimestamp = utils.readValue<BigInt>(
    vaultContract.try_lastReport(),
    constants.BIGINT_ZERO
  );
  let strategistFeeValue = strategyStore.performanceFee;

  let delegatedAssets = utils.readValue<BigInt>(
    strategyContract.try_delegatedAssets(),
    constants.BIGINT_ZERO
  );

  let inputToken = Token.load(vaultStore!.inputTokens[0]);
  let inputTokenAddress = Address.fromString(vaultStore!.inputTokens[0]);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken!.decimals as u8);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);

  // Caluculating managementFee
  let managementFeeValue = utils.readValue<BigInt>(
    vaultContract.try_managementFee(),
    constants.BIGINT_ZERO
  );
  let managementFee = strategyStore.totalDebt
    .minus(delegatedAssets)
    .times(reportTimestamp.minus(strategyStore.lastReport))
    .times(managementFeeValue)
    .div(constants.MAX_BPS)
    .div(constants.SECONDS_PER_YEAR)
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal());

  // Caluculating strategistFee
  let strategistFee = gain
    .times(strategistFeeValue)
    .div(constants.MAX_BPS)
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal());

  // Caluculating performanceFee
  let performanceFeeValue = utils.readValue<BigInt>(
    vaultContract.try_performanceFee(),
    constants.BIGINT_ZERO
  );
  let performanceFee = gain
    .times(performanceFeeValue)
    .div(constants.MAX_BPS)
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal());

  let totalSupply = vaultContract.totalSupply();
  let totalSharesMinted = totalSupply
    .minus(vaultStore!.outputTokenSupply)
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal());

  let protocolEarnings: BigDecimal;
  if (managementFee.plus(performanceFee).notEqual(constants.BIGDECIMAL_ZERO)) {
    protocolEarnings = totalSharesMinted.minus(
      strategistFee
        .times(totalSharesMinted)
        .div(managementFee.plus(performanceFee))
    );
  } else {
    protocolEarnings = constants.BIGDECIMAL_ZERO;
  }

  let outputTokenPriceUsd = getPriceOfStakedTokens(
    Address.fromString(vaultStore!.id),
    inputTokenAddress,
    inputTokenDecimals.toBigDecimal()
  );

  let gainUsd = inputTokenPrice.usdPrice
    .times(gain.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimals.toBigDecimal());

  let financialMetricsId: i64 =
    event.block.timestamp.toI64() / constants.SECONDS_PER_DAY;

  const financialMetrics = utils.getOrCreateFinancialSnapshots(
    financialMetricsId.toString()
  );

  // protocolSideRevenueUSD = PerformanceFee + ManagementFee
  financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(
    outputTokenPriceUsd.times(protocolEarnings)
  );

  // supplySideRevenue = Gains
  financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(
    gainUsd
  );

  // totalRevenueUSD = PerformanceFee + ManagementFee + StratergyFee + Gains
  financialMetrics.totalRevenueUSD = financialMetrics.totalRevenueUSD.plus(
    gainUsd.plus(outputTokenPriceUsd.times(totalSharesMinted))
  );

  vaultStore!.inputTokenBalances = [
    vaultStore!.inputTokenBalances[0].plus(gain),
  ];
  vaultStore!.outputTokenSupply = totalSupply;

  strategyStore.totalDebt = strategyStore.totalDebt.plus(debtAdded);
  strategyStore.lastReport = reportTimestamp;

  log.warning(
    "[StrategyReported] vaultAddress: {}, strategyAddress: {}, totalSharesMinted: {}, \
    protocolSideRevenue: {}, supplySideRevenueUSD: {}, totalRevenueUSD: {}, outputTokenPrice: {}, \
    protocolEarnings: {}, managementFee: {}, performanceFee: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      totalSharesMinted.toString(),
      financialMetrics.protocolSideRevenueUSD.toString(),
      financialMetrics.supplySideRevenueUSD.toString(),
      financialMetrics.totalRevenueUSD.toString(),
      outputTokenPriceUsd.toString(),
      protocolEarnings.toString(),
      managementFee.toString(),
      performanceFee.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  financialMetrics.save();
  strategyStore.save();
  vaultStore!.save();
}
