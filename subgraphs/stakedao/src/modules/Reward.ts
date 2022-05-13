import * as constants from "../common/constants";
import { CustomPriceType } from "../Prices/common/types";
import { Vault as VaultStore } from "../../generated/schema";
import { Address, BigDecimal, ethereum, log } from "@graphprotocol/graph-ts";
import { Gauge as GaugeContract } from "../../generated/templates/Gauge/Gauge";
import { getOrCreateFinancialDailySnapshots, getOrCreateYieldAggregator } from "../common/initializers";

export function updateRewardTokenEmission(
  vaultAddress: Address,
  gaugeAddress: Address,
  rewardTokenIdx: i32,
  rewardTokenAddress: Address,
  rewardTokenDecimals: BigDecimal,
  rewardTokenPricePerToken: CustomPriceType
): void {
  const vault = VaultStore.load(vaultAddress.toHexString());
  if (!vault) return;

  const gaugeContract = GaugeContract.bind(gaugeAddress);
  const rewardDataCall = gaugeContract.try_rewardData(rewardTokenAddress);

  if (rewardDataCall.reverted) return;

  const rewardRate = rewardDataCall.value.value3;
  const rewardEmissionRatePerDay = rewardRate.times(
    constants.BIGINT_SECONDS_PER_DAY
  );

  let rewardTokenEmissionsAmount = vault.rewardTokenEmissionsAmount!;
  let rewardTokenEmissionsUSD = vault.rewardTokenEmissionsUSD!;

  rewardTokenEmissionsAmount[rewardTokenIdx] = rewardEmissionRatePerDay;
  rewardTokenEmissionsUSD[rewardTokenIdx] = rewardEmissionRatePerDay
    .toBigDecimal()
    .times(rewardTokenPricePerToken.usdPrice)
    .div(rewardTokenPricePerToken.decimalsBaseTen)
    .div(rewardTokenDecimals);
  
  vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  vault.save();
  
  log.warning(
    "[RewardTokenEmission] rewardEmissionRatePerDay: {}, rewardEmissionPerDay: {}, rewardEmissionPerDayUSD: {}",
    [
      rewardEmissionRatePerDay.toString(),
      vault.rewardTokenEmissionsUSD![rewardTokenIdx].toString()
    ]
  );
}


export function updateFinancialsAfterRewardAdded(
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
