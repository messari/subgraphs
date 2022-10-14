import {
  Deposit,
  EmergencyWithdraw,
  LogPoolAddition,
  LogSetPool,
  Withdraw,
} from "../../../../../generated/MasterChefV2/MasterChefV2Sushiswap";
import { _MasterChefStakingPool } from "../../../../../generated/schema";
import {
  createMasterChefStakingPool,
  updateMasterChefTotalAllocation,
} from "../../../../../src/common/masterchef/helpers";
import { updateMasterChef } from "../../common/handlers/handleRewardV2";
import {
  BIGINT_NEG_ONE,
  MasterChef,
} from "../../../../../src/common/constants";

// A deposit or stake for the pool specific MasterChef.
export function handleDeposit(event: Deposit): void {
  updateMasterChef(event, event.params.pid, event.params.amount);
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleWithdraw(event: Withdraw): void {
  updateMasterChef(
    event,
    event.params.pid,
    event.params.amount.times(BIGINT_NEG_ONE)
  );
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  updateMasterChef(
    event,
    event.params.pid,
    event.params.amount.times(BIGINT_NEG_ONE)
  );
}

// Handle the addition of a new pool to the MasterChef. New staking pool.
export function handleLogPoolAddition(event: LogPoolAddition): void {
  const masterChefPool = createMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEFV2,
    event.params.pid,
    event.params.lpToken
  );
  updateMasterChefTotalAllocation(
    event,
    masterChefPool.poolAllocPoint,
    event.params.allocPoint,
    MasterChef.MASTERCHEFV2
  );
  masterChefPool.poolAllocPoint = event.params.allocPoint;
  masterChefPool.save();
}

// Update the allocation points of the pool.
export function handleLogSetPool(event: LogSetPool): void {
  const masterChefPool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV2 + "-" + event.params.pid.toString()
  )!;
  updateMasterChefTotalAllocation(
    event,
    masterChefPool.poolAllocPoint,
    event.params.allocPoint,
    MasterChef.MASTERCHEFV2
  );
  masterChefPool.poolAllocPoint = event.params.allocPoint;
  masterChefPool.save();
}
