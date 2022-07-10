// import { log } from "@graphprotocol/graph-ts";
import {
  Deposit,
  Withdraw,
  EmergencyWithdraw,
  Add,
  Set,
} from "../../../../../generated/MasterChefV3/MasterChefV3TraderJoe";
import {
  _HelperStore,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { MasterChef } from "../../../../../src/common/constants";
import {
  updateMasterChefDeposit,
  updateMasterChefWithdraw,
} from "../../common/handlers/handleRewardV2";
import {
  createMasterChefStakingPool,
  updateMasterChefTotalAllocation,
} from "../../common/helpers";

// A deposit or stake for the pool specific MasterChef.
export function handleDeposit(event: Deposit): void {
  updateMasterChefDeposit(event, event.params.pid, event.params.amount);
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleWithdraw(event: Withdraw): void {
  updateMasterChefWithdraw(event, event.params.pid, event.params.amount);
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  updateMasterChefWithdraw(event, event.params.pid, event.params.amount);
}

// Handle the addition of a new pool to the MasterChef. New staking pool.
export function handleAdd(event: Add): void {
  let masterChefV3Pool = createMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEFV3,
    event.params.pid,
    event.params.lpToken
  );
  updateMasterChefTotalAllocation(
    event,
    masterChefV3Pool.poolAllocPoint,
    event.params.allocPoint,
    MasterChef.MASTERCHEFV3
  );
  masterChefV3Pool.poolAllocPoint = event.params.allocPoint;
  masterChefV3Pool.save();
}

// Update the allocation points of the pool.
export function handleSet(event: Set): void {
  let masterChefV3Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV3 + "-" + event.params.pid.toString()
  )!;
  updateMasterChefTotalAllocation(
    event,
    masterChefV3Pool.poolAllocPoint,
    event.params.allocPoint,
    MasterChef.MASTERCHEFV3
  );
  masterChefV3Pool.poolAllocPoint = event.params.allocPoint;
  masterChefV3Pool.save();
}
