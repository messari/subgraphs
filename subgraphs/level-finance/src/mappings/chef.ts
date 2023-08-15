import {
  getOrCreateMasterChef,
  createMasterChefStakingPool,
  updateMasterChefTotalAllocation,
} from "../../src/common/initializers";
import {
  Deposit,
  Withdraw,
  LogSetPool,
  LogPoolAddition,
  EmergencyWithdraw,
  LogRewardPerSecond,
} from "../../generated/LevelMasterV2/LevelMaster";
import * as constants from "../common/constants";
import { updateMasterChef } from "../modules/chef";
import { _MasterChefStakingPool } from "../../generated/schema";

// A deposit or stake for the pool specific MasterChef.
export function handleDeposit(event: Deposit): void {
  updateMasterChef(event, event.params.pid, event.params.amount);
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleWithdraw(event: Withdraw): void {
  updateMasterChef(
    event,
    event.params.pid,
    event.params.amount.times(constants.BIGINT_NEGONE)
  );
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  updateMasterChef(
    event,
    event.params.pid,
    event.params.amount.times(constants.BIGINT_NEGONE)
  );
}

// Handle the addition of a new pool to the MasterChef. New staking pool.
export function handleLogPoolAddition(event: LogPoolAddition): void {
  const masterChefV2Pool = createMasterChefStakingPool(
    event,
    constants.MasterChef.MASTERCHEFV2,
    event.params.pid,
    event.params.lpToken
  );
  updateMasterChefTotalAllocation(
    event,
    masterChefV2Pool.poolAllocPoint,
    event.params.allocPoint,
    constants.MasterChef.MASTERCHEFV2
  );
  masterChefV2Pool.poolAllocPoint = event.params.allocPoint;
  masterChefV2Pool.save();
}

// Update the allocation points of the pool.
export function handleLogSetPool(event: LogSetPool): void {
  const masterChefV2Pool = _MasterChefStakingPool.load(
    constants.MasterChef.MASTERCHEFV2 + "-" + event.params.pid.toString()
  )!;
  updateMasterChefTotalAllocation(
    event,
    masterChefV2Pool.poolAllocPoint,
    event.params.allocPoint,
    constants.MasterChef.MASTERCHEFV2
  );
  masterChefV2Pool.poolAllocPoint = event.params.allocPoint;
  masterChefV2Pool.save();
}

// Update the total emissions rate of rewards for the masterchef contract.
export function handleUpdateEmissionRate(event: LogRewardPerSecond): void {
  const masterChefV2Pool = getOrCreateMasterChef(
    event,
    constants.MasterChef.MASTERCHEFV2
  );

  masterChefV2Pool.rewardTokenRate = event.params.rewardPerSecond;
  masterChefV2Pool.adjustedRewardTokenRate = event.params.rewardPerSecond;

  masterChefV2Pool.save();
}
