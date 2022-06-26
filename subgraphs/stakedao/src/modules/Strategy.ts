import { Token, Vault as VaultStore } from "../../generated/schema";
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
  getOrCreateVaultsDailySnapshots,
  getOrCreateVaultsHourlySnapshots,
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
  let performanceFee = utils.readValue<BigInt>(
    strategyContract.try_performanceFee(),
    constants.BIGINT_ZERO
  );

  let supplySideWantEarned = wantEarned
    .times(
      constants.BIGINT_HUNDRED.minus(
        performanceFee.div(constants.BIGINT_HUNDRED)
      )
    )
    .div(constants.BIGINT_HUNDRED);

  const supplySideWantEarnedUSD = supplySideWantEarned
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  let protocolSideWantEarned = wantEarned
    .times(performanceFee.div(constants.BIGINT_HUNDRED))
    .div(constants.BIGINT_HUNDRED);
  const protocolSideWantEarnedUSD = protocolSideWantEarned
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  const totalRevenueUSD = supplySideWantEarnedUSD.plus(
    protocolSideWantEarnedUSD
  );

  vault.inputTokenBalance = vault.inputTokenBalance.plus(supplySideWantEarned);

  vault.cumulativeSupplySideRevenueUSD = vault.cumulativeSupplySideRevenueUSD.plus(
    supplySideWantEarnedUSD
  );
  vault.cumulativeProtocolSideRevenueUSD = vault.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideWantEarnedUSD
  );
  vault.cumulativeTotalRevenueUSD = vault.cumulativeTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  vault.save();

  updateFinancialsAfterReport(
    block,
    totalRevenueUSD,
    supplySideWantEarnedUSD,
    protocolSideWantEarnedUSD
  );
  updateVaultSnapshotsAfterReport(
    vault,
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

export function updateVaultSnapshotsAfterReport(
  vault: VaultStore,
  block: ethereum.Block,
  totalRevenueUSD: BigDecimal,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal
): void {
  let vaultDailySnapshot = getOrCreateVaultsDailySnapshots(vault.id, block);
  let vaultHourlySnapshot = getOrCreateVaultsHourlySnapshots(vault.id, block);

  vaultDailySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultDailySnapshot.dailySupplySideRevenueUSD = vaultDailySnapshot.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  vaultDailySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultDailySnapshot.dailyProtocolSideRevenueUSD = vaultDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  vaultDailySnapshot.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultDailySnapshot.dailyTotalRevenueUSD = vaultDailySnapshot.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );

  vaultHourlySnapshot.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD;
  vaultHourlySnapshot.hourlySupplySideRevenueUSD = vaultHourlySnapshot.hourlySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  vaultHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD;
  vaultHourlySnapshot.hourlyProtocolSideRevenueUSD = vaultHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  vaultHourlySnapshot.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD;
  vaultHourlySnapshot.hourlyTotalRevenueUSD = vaultHourlySnapshot.hourlyTotalRevenueUSD.plus(
    totalRevenueUSD
  );

  vaultHourlySnapshot.save();
  vaultDailySnapshot.save();
}
