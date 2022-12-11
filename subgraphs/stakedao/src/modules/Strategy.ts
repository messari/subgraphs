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

  const inputToken = getOrCreateTokenFromString(vault.inputToken, block);
  const inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken.decimals as u8
  ).toBigDecimal();

  const vaultFees = utils.getVaultFees(vaultAddress, strategyAddress);

  const supplySideWantEarned = wantEarned.times(
    constants.BIGDECIMAL_ONE.minus(vaultFees.getPerformanceFees)
  );
  const supplySideWantEarnedUSD = supplySideWantEarned
    .div(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  const protocolSideWantEarned = wantEarned.times(vaultFees.getPerformanceFees);
  const protocolSideWantEarnedUSD = protocolSideWantEarned
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
