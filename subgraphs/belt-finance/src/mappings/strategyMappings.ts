import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import { Buyback } from "../../generated/templates/Strategy/Strategy";
import { getOrCreateToken, getOrCreateVault } from "../common/initializers";

export function handleBuyback(event: Buyback): void {
  if (utils.isBuyBackTransactionPresent(event.transaction)) return;

  const context = dataSource.context();
  const vaultAddress = Address.fromString(context.getString("vaultAddress"));

  const vault = getOrCreateVault(vaultAddress, event.block);

  const strategyAddress = event.address;
  const harvestedAmount = event.params.earnedAmount;
  const harvestTokenAddress = event.params.earnedAddress;

  const harvestedToken = getOrCreateToken(harvestTokenAddress, event.block);

  const harvestedAmountUSD = harvestedAmount
    .divDecimal(
      constants.BIGINT_TEN.pow(harvestedToken.decimals as u8).toBigDecimal()
    )
    .times(harvestedToken.lastPriceUSD!);

  const performanceFeesPercentage = utils.getStrategyPerformaceFees(
    vaultAddress,
    strategyAddress
  );

  const supplySideRevenueUSD = harvestedAmountUSD.times(
    constants.BIGDECIMAL_ONE.minus(
      performanceFeesPercentage.feePercentage!.div(constants.BIGDECIMAL_HUNDRED)
    )
  );

  const protocolSideRevenueUSD = harvestedAmountUSD.times(
    performanceFeesPercentage.feePercentage!.div(constants.BIGDECIMAL_HUNDRED)
  );

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[BuyBack] vaultAddress: {}, strategyAddress: {}, harvestedAmountUSD: {}, supplySideRevenueUSD: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vault.id,
      strategyAddress.toHexString(),
      harvestedAmountUSD.toString(),
      supplySideRevenueUSD.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
