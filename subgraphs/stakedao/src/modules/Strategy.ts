import {
  Token,
  Vault as VaultStore,
} from "../../generated/schema";
import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateYieldAggregator,
  getOrCreateFinancialDailySnapshots,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { Strategy as StrategyContract } from "../../generated/templates/Strategy/Strategy";

export function _StrategyHarvested(
  strategyAddress: Address,
  vault: VaultStore,
  wantEarned: BigInt,
  block: ethereum.Block,
  transaction: ethereum.Transaction
): void {
  const strategyContract = StrategyContract.bind(strategyAddress);

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  // load performance fee and get the fees percentage
  let performanceFee = utils
    .readValue<BigInt>(
      strategyContract.try_performanceFee(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  let supplySideWantEarned = wantEarned
    .toBigDecimal()
    .times(
      constants.BIGDECIMAL_ONE.minus(performanceFee.div(constants.DENOMINATOR))
    );
  const supplySideWantEarnedUSD = supplySideWantEarned
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  let protocolSideWantEarned = wantEarned
    .toBigDecimal()
    .times(performanceFee)
    .div(constants.BIGDECIMAL_HUNDRED);
  const protocolSideWantEarnedUSD = protocolSideWantEarned
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  const totalRevenueUSD = supplySideWantEarnedUSD
    .plus(protocolSideWantEarnedUSD);
  
  vault.inputTokenBalance = vault.inputTokenBalance.plus(wantEarned);
  vault.save();

  updateFinancialsAfterReport(
    block,
    totalRevenueUSD,
    supplySideWantEarnedUSD,
    protocolSideWantEarnedUSD
  );

  log.warning(
    "[Harvested] vault: {}, Strategy: {}, supplySideWantEarned: {}, protocolSideWantEarned: {}, inputToken: {}, totalRevenueUSD: {}, TxHash: {}",
    [
      vault.id,
      strategyAddress.toHexString(),
      supplySideWantEarned.toString(),
      protocolSideWantEarned.toString(),
      inputTokenAddress.toHexString(),
      totalRevenueUSD.toString(),
      transaction.hash.toHexString(),
    ]
  );
}

export function updateFinancialsAfterReport(
  block: ethereum.Block,
  totalRevenueUSD: BigDecimal,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal
): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const protocol = getOrCreateYieldAggregator();

  // TotalRevenueUSD Metrics
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  // SupplySideRevenueUSD Metrics
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;

  // ProtocolSideRevenueUSD Metrics
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();
  protocol.save();
}
