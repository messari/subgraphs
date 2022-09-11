import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { getOrCreateVault } from "../common/initializers";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { Address, dataSource, log } from "@graphprotocol/graph-ts";
import { Buyback } from "../../generated/templates/Strategy/Strategy";

export function handleBuyback(event: Buyback): void {
  if (utils.isBuyBackTransactionPresent(event.transaction)) return;

  const context = dataSource.context();
  const vaultAddress = Address.fromString(context.getString("vaultAddress"));

  const vault = getOrCreateVault(vaultAddress, event.block);

  const strategyAddress = event.address;
  const harvestedAmount = event.params.earnedAmount;
  const harvestTokenAddress = event.params.earnedAddress;

  let harvestedTokenPrice = getUsdPricePerToken(harvestTokenAddress);
  let harvestedTokenDecimals = utils.getTokenDecimals(harvestTokenAddress);

  let harvestedAmountUSD = harvestedAmount
    .divDecimal(harvestedTokenDecimals)
    .times(harvestedTokenPrice.usdPrice)
    .div(harvestedTokenPrice.decimalsBaseTen);

  let performanceFeesPercentage = utils.getStrategyPerformaceFees(
    vaultAddress,
    strategyAddress
  );

  let supplySideRevenueUSD = harvestedAmountUSD.times(
    constants.BIGDECIMAL_ONE.minus(
      performanceFeesPercentage.feePercentage!.div(constants.BIGDECIMAL_HUNDRED)
    )
  );

  let protocolSideRevenueUSD = harvestedAmountUSD.times(
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
