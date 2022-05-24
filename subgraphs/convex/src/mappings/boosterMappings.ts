import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metric";
import {
  SetFeesCall,
  AddPoolCall,
  EarmarkRewardsCall,
  Deposited as DepositedEvent,
  Withdrawn as WithdrawnEvent,
} from "../../generated/Booster/Booster";
import * as utils from "../common/utils";
import { _NewVault } from "../modules/Vault";
import { log } from "@graphprotocol/graph-ts";
import { deposit } from "../modules/Deposit";
import { withdraw } from "../modules/Withdraw";
import * as constants from "../common/constants";
import { CustomFeesType } from "../common/types";
import { VaultFee } from "../../generated/schema";
import { _EarmarkRewards } from "../modules/Rewards";
import { Vault as VaultStore } from "../../generated/schema";
import { getOrCreateYieldAggregator } from "../common/initializer";

export function handleAddPool(call: AddPoolCall): void {
  const gaugeAddress = call.inputs._gauge;
  const lpTokenAddress = call.inputs._lptoken;
  const stashVersion = call.inputs._stashVersion;

  // Update PoolId
  const protocol = getOrCreateYieldAggregator();
  const poolId = protocol._poolCount;
  protocol._poolCount = protocol._poolCount.plus(constants.BIGINT_ONE);
  protocol.save();

  _NewVault(poolId, lpTokenAddress, gaugeAddress, stashVersion, call.block);

  log.warning("[AddPool] poolId: {}, lpToken: {}, TxHash: {}", [
    poolId.toString(),
    lpTokenAddress.toHexString(),
    call.transaction.hash.toHexString(),
  ]);
}

export function handleDeposited(event: DepositedEvent): void {
  const user = event.params.user;
  const poolId = event.params.poolid;
  const depositAmount = event.params.amount;

  const vaultId = constants.CONVEX_BOOSTER_ADDRESS.toHexString()
    .concat("-")
    .concat(poolId.toString());
  const vault = VaultStore.load(vaultId);

  if (vault) {
    deposit(user, vault, depositAmount, event.block, event.transaction);
  }

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(poolId, event.block);

  log.info("[Deposited] poolId: {}, depositAmount: {}, TxHash: {}", [
    poolId.toString(),
    depositAmount.toString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  const user = event.params.user;
  const poolId = event.params.poolid;
  const withdrawAmount = event.params.amount;

  const vaultId = constants.CONVEX_BOOSTER_ADDRESS.toHexString()
    .concat("-")
    .concat(poolId.toString());
  const vault = VaultStore.load(vaultId);

  if (vault) {
    withdraw(user, vault, withdrawAmount, event.block, event.transaction);
  }

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(poolId, event.block);

  log.info("[Withdrawn] poolId: {}, withdrawAmount: {}, TxHash: {}", [
    poolId.toString(),
    withdrawAmount.toString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handleEarmarkRewards(call: EarmarkRewardsCall): void {
  const poolId = call.inputs._pid;
  const vaultId = constants.CONVEX_BOOSTER_ADDRESS.toHexString()
    .concat("-")
    .concat(poolId.toString());

  _EarmarkRewards(poolId, vaultId, call.transaction, call.block);
}

export function handleSetFees(call: SetFeesCall): void {
  const lockFees = call.inputs._lockFees;
  const callerFees = call.inputs._callerFees;
  const stakerFees = call.inputs._stakerFees;
  const platformFees = call.inputs._platform;
  const newFees = new CustomFeesType(
    lockFees,
    callerFees,
    stakerFees,
    platformFees
  );

  const performanceFeeId = utils
    .enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE)
    .concat(constants.CONVEX_BOOSTER_ADDRESS.toHexString());

  const fees = VaultFee.load(performanceFeeId);
  fees!.feePercentage = newFees.totalFees();
  fees!.save();
}
