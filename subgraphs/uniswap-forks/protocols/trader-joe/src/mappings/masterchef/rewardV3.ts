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
import {
  BIGINT_NEG_ONE,
  MasterChef,
  ZERO_ADDRESS,
} from "../../../../../src/common/constants";
import { updateMasterChef } from "../../common/handlers/handleRewardV3";
import { setPoolRewarder } from "../../common/handlers/handleRewarder";
import {
  createMasterChefStakingPool,
  updateMasterChefTotalAllocation,
} from "../../../../../src/common/masterchef/helpers";

// A deposit or stake for the pool specific MasterChef.
export function handleDeposit(event: Deposit): void {
  updateMasterChef(
    event,
    event.params.pid,
    event.params.amount,
    event.params.user
  );
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleWithdraw(event: Withdraw): void {
  updateMasterChef(
    event,
    event.params.pid,
    event.params.amount.times(BIGINT_NEG_ONE),
    event.params.user
  );
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  updateMasterChef(
    event,
    event.params.pid,
    event.params.amount.times(BIGINT_NEG_ONE),
    event.params.user
  );
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

  if (event.params.rewarder.toHexString() != ZERO_ADDRESS) {
    setPoolRewarder(event.params.rewarder, masterChefV3Pool);
  }
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

  if (event.params.overwrite) {
    setPoolRewarder(event.params.rewarder, masterChefV3Pool);
  }

  masterChefV3Pool.save();
}
