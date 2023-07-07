import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metric";
import {
  getOrCreateVault,
  getOrCreateYieldAggregator,
} from "../common/initializers";
import {
  SetFeesCall,
  AddPoolCall,
  Deposited as DepositedEvent,
  Withdrawn as WithdrawnEvent,
} from "../../generated/Booster/Booster";
import * as utils from "../common/utils";
import { Deposit } from "../modules/Deposit";
import { withdraw } from "../modules/Withdraw";
import * as constants from "../common/constants";
import { CustomFeesType } from "../common/types";
import { VaultFee } from "../../generated/schema";

export function handleAddPool(call: AddPoolCall): void {
  // Update PoolId
  const protocol = getOrCreateYieldAggregator();
  const poolId = protocol._poolCount;
  protocol._poolCount = protocol._poolCount.plus(constants.BIGINT_ONE);
  protocol.save();

  getOrCreateVault(poolId, call.block);
}

export function handleDeposited(event: DepositedEvent): void {
  const poolId = event.params.poolid;
  const depositAmount = event.params.amount;

  const vault = getOrCreateVault(poolId, event.block);
  if (vault) {
    Deposit(
      vault,
      depositAmount,
      event.params.user,
      event.transaction,
      event.block
    );
  }

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(poolId, event.block);
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  const poolId = event.params.poolid;
  const withdrawAmount = event.params.amount;

  const vault = getOrCreateVault(poolId, event.block);

  if (vault) {
    withdraw(
      vault,
      withdrawAmount,
      event.params.user,
      event.transaction,
      event.block
    );
  }

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(poolId, event.block);
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
