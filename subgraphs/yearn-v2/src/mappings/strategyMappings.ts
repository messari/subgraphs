import {
  Token,
  Vault as VaultStore,
  _Strategy as StrategyStore,
} from "../../generated/schema";

import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getUsdPricePerToken } from "../Prices";
import {
  Cloned as ClonedEvent,
  Harvested as HarvestedEvent,
} from "../../generated/templates/Strategy/Strategy";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Strategy as StrategyTemplate } from "../../generated/templates";

export function handleCloned(event: ClonedEvent): void {
  const clonedStrategyAddress = event.params.clone;

  StrategyTemplate.create(clonedStrategyAddress);
}

export function handleHarvested(event: HarvestedEvent): void {
  const strategyAddress = event.address.toHexString();
  const strategy = StrategyStore.load(strategyAddress);

  if (strategy) {
    const vaultAddress = strategy.vaultAddress;
    const vault = VaultStore.load(vaultAddress.toHexString());

    let financialMetricsId: i64 =
      event.block.timestamp.toI64() / constants.SECONDS_PER_DAY;
    const financialMetrics = utils.getOrCreateFinancialSnapshots(
      financialMetricsId.toString()
    );

    let wantEarned = event.params.profit
      .times(
        constants.BIGINT_HUNDRED.minus(
          BigInt.fromString(performanceFee.toString())
        )
      )
      .div(constants.BIGINT_HUNDRED);

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
