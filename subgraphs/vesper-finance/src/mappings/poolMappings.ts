import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import * as utils from "../common/utils";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  EarningReported as EarningReportedEvent,
  UniversalFeePaid as UniversalFeePaidEvent,
  UpdatedPoolRewards as UpdatedPoolRewardsEvent,
  UpdatedWithdrawFee as UpdatedWithdrawFeeEvent,
  UpdatedUniversalFee as UpdatedUniversalFeeEvent,
} from "../../generated/templates/PoolRewards/Pool";
import { Address, log } from "@graphprotocol/graph-ts";
import { PoolRewards } from "../../generated/templates";
import { updateRevenueSnapshots } from "../modules/Revenue";
import { updateRewardTokenEmissions } from "../modules/Rewards";
import { getOrCreateFee, getOrCreateVault } from "../common/initializers";
import { PoolRewards as PoolRewardsContract } from "../../generated/templates/PoolRewards/PoolRewards";

export function handleDeposit(event: DepositEvent): void {
  const vaultAddress = event.address;
  const sharesMinted = event.params.shares;
  const depositAmount = event.params.amount;

  Deposit(
    vaultAddress,
    depositAmount,
    sharesMinted,
    event.transaction,
    event.block
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleWithdraw(event: WithdrawEvent): void {
  const vaultAddress = event.address;
  const sharesBurnt = event.params.shares;
  const withdrawAmount = event.params.amount;

  Withdraw(
    vaultAddress,
    withdrawAmount,
    sharesBurnt,
    event.transaction,
    event.block
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleUniversalFeePaid(event: UniversalFeePaidEvent): void {
  const vaultAddress = event.address;
  const vault = getOrCreateVault(vaultAddress, event.block);

  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = utils.getTokenDecimals(inputTokenAddress);

  const protocolSideRevenueUSD = event.params.fee
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    event.block
  );
}

export function handleUpdatedUniversalFee(
  event: UpdatedUniversalFeeEvent
): void {}

export function handleUpdatedWithdrawFee(event: UpdatedWithdrawFeeEvent): void {
  const vaultAddress = event.address;
  const withdrawalFeeId =
    utils.enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE) +
    vaultAddress.toHexString();

  const withdrawalFee = getOrCreateFee(
    withdrawalFeeId,
    constants.VaultFeeType.WITHDRAWAL_FEE
  );

  withdrawalFee.feePercentage = event.params.newWithdrawFee
    .toBigDecimal()
    .div(constants.MAX_BPS.toBigDecimal());

  withdrawalFee.save();

  log.info("[UpdateWithdrawFee] vault: {}, newWithdrawFee: {}", [
    vaultAddress.toHexString(),
    withdrawalFee.feePercentage!.toString(),
  ]);
}

export function handleEarningReported(event: EarningReportedEvent): void {
  const vaultAddress = event.address;
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

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleUpdatedPoolRewards(event: UpdatedPoolRewardsEvent): void {
  const newPoolRewards = event.params.newPoolRewards;

  const poolRewardsContract = PoolRewardsContract.bind(newPoolRewards);
  const vaultAddress = utils.readValue<Address>(
    poolRewardsContract.try_pool(),
    constants.NULL.TYPE_ADDRESS
  );

  const rewardTokens = utils.readValue<Address[]>(
    poolRewardsContract.try_getRewardTokens(),
    []
  );

  for (let i = 0; i < rewardTokens.length; i += 1) {
    let rewardToken = rewardTokens[i];

    updateRewardTokenEmissions(
      rewardToken,
      vaultAddress,
      constants.BIGINT_ZERO,
      event.block
    );
  }

  if (newPoolRewards.notEqual(constants.NULL.TYPE_ADDRESS))
    PoolRewards.create(newPoolRewards);

  log.warning("[UpdatedPoolRewards] vault: {}, newPoolRewards: {}", [
    event.address.toHexString(),
    newPoolRewards.toHexString(),
  ]);
}
