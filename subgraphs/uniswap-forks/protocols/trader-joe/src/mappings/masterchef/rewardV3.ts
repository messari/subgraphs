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

export function handleDeposit(event: Deposit): void {
  updateMasterChefDeposit(event, event.params.pid, event.params.amount);
}

export function handleWithdraw(event: Withdraw): void {
  updateMasterChefWithdraw(event, event.params.pid, event.params.amount);
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  updateMasterChefWithdraw(event, event.params.pid, event.params.amount);
}

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
