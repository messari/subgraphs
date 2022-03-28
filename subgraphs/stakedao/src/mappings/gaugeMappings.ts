import {
  RewardPaid,
  AddRewardCall,
  Gauge as GaugeContract,
  RewardAdded,
} from "../../generated/templates/Gauge/Gauge";

import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getUsdPriceOfToken } from "../modules/Price";
import { RewardToken, Vault as VaultStore } from "../../generated/schema";
import {
  ethereum,
  BigInt,
  Address,
  log,
  BigDecimal,
} from "@graphprotocol/graph-ts";

export function handleRewardPaid(event: RewardPaid): void {
  const gaugeAddress = event.address;
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  let try_stakingToken = gaugeContract.try_stakingToken();

  const vaultAddress = try_stakingToken.reverted
    ? Address.fromString(constants.ZERO_ADDRESS)
    : try_stakingToken.value;

  const vault = VaultStore.load(vaultAddress.toHexString());
  if (vault) {
    let rewardTokenDecimals: BigInt, rewardTokenPrice: BigDecimal;
    let rewardTokenEmissionsAmount: Array<BigInt> = [];
    let rewardTokenEmissionsUSD: Array<BigDecimal> = [];

    for (let i = 0; i < vault._rewardTokensIds.length; i++) {
      let rewardToken = RewardToken.load(vault._rewardTokensIds[i]);
      rewardTokenPrice = getUsdPriceOfToken(
        Address.fromString(vault._rewardTokensIds[i])
      );
      rewardTokenDecimals = BigInt.fromI32(10).pow(rewardToken!.decimals as u8);

      rewardTokenEmissionsAmount.push(event.params.reward);
      rewardTokenEmissionsUSD.push(
        rewardTokenPrice
          .times(event.params.reward.toBigDecimal())
          .div(rewardTokenDecimals.toBigDecimal())
      );
    }
    vault.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
    vault.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

    vault.save();
  }
}

export function handleAddReward(call: AddRewardCall): void {
  const gaugeAddress = call.to;
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  const vaultAddress = gaugeContract.stakingToken();
  const vault = VaultStore.load(vaultAddress.toHexString());

  if (vault) {
    let rewardTokensIds: string[] = [];
    let rewardTokenAddress: Address;
    let try_rewardTokens: ethereum.CallResult<Address>;

    // Assuming that their are a maximum of 10 rewardTokens in the whole supgraph.
    for (let i = 0; i <= 10; i++) {
      try_rewardTokens = gaugeContract.try_rewardTokens(BigInt.fromI32(i));

      if (try_rewardTokens.reverted) {
        break;
      }
      rewardTokenAddress = try_rewardTokens.value;
      const rewardToken = utils.getOrCreateRewardToken(rewardTokenAddress);
      rewardTokensIds.push(rewardToken.id);
    }
    vault.rewardTokens = rewardTokensIds;
    vault._rewardTokensIds = rewardTokensIds;
    vault.save();

    log.warning(
      "[Gauge: AddReward] vaultId: {}, gaugeId: {}, rewardTokensIds: {}",
      [
        vaultAddress.toHexString(),
        gaugeAddress.toHexString(),
        rewardTokensIds.join(", "),
      ]
    );
  }
}

export function handleRewardAdded(event: RewardAdded): void {
  const gaugeAddress = event.address;
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  const vaultAddress = gaugeContract.stakingToken();
  const vault = VaultStore.load(vaultAddress.toHexString());

  let financialMetricsId: i64 =
    event.block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  const financialMetrics = utils.getOrCreateFinancialSnapshots(
    financialMetricsId.toString()
  );

  let supplySideRevenue = event.params.reward;

  // load performance fee and get the fees percentage
  let performanceFee = utils.getFeePercentage(
    vaultAddress.toHexString(),
    constants.VaultFeeType.PERFORMANCE_FEE
  );
  let totalRevenue = supplySideRevenue
    .times(constants.BIGINT_HUNDRED)
    .div(
      constants.BIGINT_HUNDRED.minus(
        BigInt.fromString(performanceFee.toString())
      )
    );

  let protocolRevenue = totalRevenue.minus(supplySideRevenue);

  let rewardToken = RewardToken.load(vault!._rewardTokensIds[0]);
  let rewardTokenAddress = Address.fromString(vault!._rewardTokensIds[0]);
  let rewardTokenDecimals = BigInt.fromI32(10).pow(rewardToken!.decimals as u8);
  let rewardTokenPrice = getUsdPriceOfToken(rewardTokenAddress);

  financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(
    rewardTokenPrice
      .times(supplySideRevenue.toBigDecimal())
      .div(rewardTokenDecimals.toBigDecimal())
  );

  financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD
    .plus(
      rewardTokenPrice
        .times(protocolRevenue.toBigDecimal())
    )
    .plus(financialMetrics.feesUSD);

  financialMetrics.save();

  log.warning(
    "[RewardAdded] financialMetricsId: {}, supplySideRevenue: {}, protocolRevenue: {}, rewardTokenAddr: {}, rewardTokenPrice: {}, supplySideRevenueUSD: {}, protocolSideRevenueUSD: {}, TxHash: {}",
    [
      financialMetricsId.toString(),
      supplySideRevenue.toString(),
      protocolRevenue.toString(),
      vault!._rewardTokensIds[0],
      rewardTokenPrice.toString(),
      financialMetrics.supplySideRevenueUSD.toString(),
      financialMetrics.protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
