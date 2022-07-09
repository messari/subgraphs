import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { getOrCreateVault } from "../common/initializers";
import { updateRevenueSnapshots } from "../modules/Revenue";
import {
  LossReported as LossReportedEvent,
  EarningReported as EarningReportedEvent,
} from "../../generated/templates/PoolAccountant/PoolAccountant";
import { PoolAccountant as PoolAccountantContract } from "../../generated/templates/PoolAccountant/PoolAccountant";

export function handleEarningReported(event: EarningReportedEvent): void {
  const poolAccountantAddress = event.address;
  const accountantContract = PoolAccountantContract.bind(poolAccountantAddress);

  const vaultAddress = utils.readValue<Address>(
    accountantContract.try_pool(),
    constants.NULL.TYPE_ADDRESS
  );
  const vault = getOrCreateVault(vaultAddress, event.block);

  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = utils.getTokenDecimals(inputTokenAddress);

  const supplySideRevenueUSD = event.params.profit
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
}

export function handleLossReported(event: LossReportedEvent): void {
  const poolAccountantAddress = event.address;
  const accountantContract = PoolAccountantContract.bind(poolAccountantAddress);

  const vaultAddress = utils.readValue<Address>(
    accountantContract.try_pool(),
    constants.NULL.TYPE_ADDRESS
  );
  const vault = getOrCreateVault(vaultAddress, event.block);

  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = utils.getTokenDecimals(inputTokenAddress);

  const supplySideLossUSD = event.params.loss
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen)
    .times(constants.BIGDECIMAL_NEGATIVE_ONE);

  updateRevenueSnapshots(
    vault,
    supplySideLossUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );
}
