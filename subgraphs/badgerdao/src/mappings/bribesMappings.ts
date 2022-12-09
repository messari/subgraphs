import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import {
  BribeEmission,
  SentBribeToTree,
  SentBribeToGovernance,
  PerformanceFeeGovernance,
} from "../../generated/templates/BribesProcessor/BribesProcessor";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { getOrCreateToken, getOrCreateVault } from "../common/initializers";

export function handleBribeEmission(event: BribeEmission): void {
  const tokenAddress = event.params.token;
  const bribeEmissionAmount = event.params.amount;

  if (bribeEmissionAmount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantToken = getOrCreateToken(tokenAddress, event.block);
  const wantTokenDecimals = constants.BIGINT_TEN.pow(
    wantToken.decimals as u8
  ).toBigDecimal();

  const supplySideRevenueUSD = bribeEmissionAmount
    .divDecimal(wantTokenDecimals)
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning(
    "[Bribes:BribeEmission] Vault: {}, wantToken: {}, bribeEmissionAmount: {}, supplySideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      tokenAddress.toHexString(),
      bribeEmissionAmount.toString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handlePerformanceFeeGovernance(
  event: PerformanceFeeGovernance
): void {
  const tokenAddress = event.params.token;
  const performanceFeeAmount = event.params.amount;

  if (performanceFeeAmount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantToken = getOrCreateToken(tokenAddress, event.block);
  const wantTokenDecimals = constants.BIGINT_TEN.pow(
    wantToken.decimals as u8
  ).toBigDecimal();

  const protocolSideRevenueUSD = performanceFeeAmount
    .divDecimal(wantTokenDecimals)
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[Bribes:PerformanceFeeGovernance] Vault: {}, wantToken: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      tokenAddress.toHexString(),
      performanceFeeAmount.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleSentBribeToGovernance(
  event: SentBribeToGovernance
): void {
  const tokenAddress = event.params.token;
  const performanceFeeAmount = event.params.amount;

  if (performanceFeeAmount.equals(constants.BIGINT_ZERO)) return;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const wantToken = getOrCreateToken(tokenAddress, event.block);
  const wantTokenDecimals = constants.BIGINT_TEN.pow(
    wantToken.decimals as u8
  ).toBigDecimal();

  const protocolSideRevenueUSD = performanceFeeAmount
    .divDecimal(wantTokenDecimals)
    .times(wantToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[SentBribeToGovernance] Vault: {}, wantToken: {}, amount: {}, protocolSideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      tokenAddress.toHexString(),
      performanceFeeAmount.toString(),
      protocolSideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleSentBribeToTree(event: SentBribeToTree): void {
  const bribesAddress = event.address;
  const rewardTokenAddress = event.params.token;
  const rewardTokenEmissionAmount = event.params.amount;

  const vaultAddress = utils.getVaultAddressFromContext();
  const vault = getOrCreateVault(vaultAddress, event.block);

  const rewardToken = getOrCreateToken(rewardTokenAddress, event.block);
  const rewardTokenDecimals = constants.BIGINT_TEN.pow(
    rewardToken.decimals as u8
  ).toBigDecimal();

  const supplySideRevenueUSD = rewardTokenEmissionAmount
    .divDecimal(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning(
    "[SentBribeToTree] Vault: {}, BribesProcessor: {}, supplySideRevenueUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      bribesAddress.toHexString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
