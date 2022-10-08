import {
  getOrCreateVault,
  getOrCreateTokenFromString,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";
import { log, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";

export function Harvested(
  vaultAddress: Address,
  strategyAddress: Address,
  wantEarned: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);

  let inputToken = getOrCreateTokenFromString(vault.inputToken, block);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken.decimals as u8
  ).toBigDecimal();

  let vaultFees = utils.getVaultFees(vaultAddress, strategyAddress);

  let supplySideWantEarned = wantEarned.times(
    constants.BIGDECIMAL_ONE.minus(vaultFees.getPerformanceFees)
  );
  let supplySideWantEarnedUSD = supplySideWantEarned
    .div(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  let protocolSideWantEarned = wantEarned.times(vaultFees.getPerformanceFees);
  let protocolSideWantEarnedUSD = protocolSideWantEarned
    .div(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideWantEarnedUSD,
    protocolSideWantEarnedUSD,
    block
  );

  log.warning(
    "[Harvested] vault: {}, Strategy: {}, supplySideWantEarned: {}, protocolSideWantEarned: {}, TxHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      supplySideWantEarned.toString(),
      protocolSideWantEarned.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
