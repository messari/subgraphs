import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "../modules/Revenue";
import {
  Claimed,
  GaugeSet,
  VaultToggled,
} from "../../generated/curveStrategy/LiquidityLockerStrategy";
import { Gauge as GaugeTemplate } from "../../generated/templates";
import { getOrCreateToken, getOrCreateVault } from "../common/initializers";

export function handleVaultToggled(event: VaultToggled): void {
  const vaultAddress = event.params._vault;
  const vault = getOrCreateVault(vaultAddress, event.block);

  log.warning("[VaultToggled] - VaultId: {}, TxHash: {}", [
    vault.id,
    event.transaction.hash.toHexString(),
  ]);
}

export function handleGaugeSet(event: GaugeSet): void {
  const tokenAddress = event.params._token;
  const gaugeAddress = event.params._gauge;
  const liquidityLockerStrategyAddress = event.address;

  const multiGaugeAddress = utils.getMultiGaugeFromLiquidityLocker(
    gaugeAddress,
    liquidityLockerStrategyAddress
  );
  GaugeTemplate.create(multiGaugeAddress);

  const vaultAddress = utils.getVaultFromGauge(multiGaugeAddress);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) return;

  const vault = getOrCreateVault(vaultAddress, event.block);
  vault.fees = utils
    .getLiquidityLockersVaultFees(liquidityLockerStrategyAddress, vaultAddress)
    .stringIds();

  vault.save();

  log.warning(
    "[GaugeSet] - VaultId: {}, tokenAddress: {}, gaugeAddress: {}, TxHash: {}",
    [
      vault.id,
      tokenAddress.toHexString(),
      multiGaugeAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleClaimed(event: Claimed): void {
  const strategyAddress = event.address;
  const gaugeAddress = event.params._gauge;
  const tokenAddress = event.params._token;
  const earnedAmount = event.params._amount;

  const vaultAddress = utils.getVaultFromGauge(gaugeAddress);
  const vault = getOrCreateVault(vaultAddress, event.block);
  if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) {
    log.warning("[VaultNotFound] gaugeAddress: {}, tokenAddress: {}", [
      gaugeAddress.toHexString(),
      tokenAddress.toHexString(),
    ]);

    return;
  }

  const vaultFees = utils.getLiquidityLockersVaultFees(
    strategyAddress,
    vaultAddress
  );

  const earnedToken = getOrCreateToken(tokenAddress, event.block);
  const earnedTokenDecimals = constants.BIGINT_TEN.pow(
    earnedToken.decimals as u8
  ).toBigDecimal();

  const totalRevenue = earnedAmount
    .divDecimal(earnedTokenDecimals)
    .times(earnedToken.lastPriceUSD!);

  const supplySideRevenue = totalRevenue.times(
    constants.BIGDECIMAL_ONE.minus(vaultFees.getPerformanceFees)
  );

  const protocolSideRevenue = totalRevenue.times(vaultFees.getPerformanceFees);

  updateRevenueSnapshots(
    vault,
    supplySideRevenue,
    protocolSideRevenue,
    event.block
  );
}
