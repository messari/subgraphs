import { Deposit, EmergencyWithdraw, LogPoolAddition, LogSetPool, Withdraw } from "../../../../../generated/MasterChefV2/MasterChefV2Sushiswap";
import { _MasterChefStakingPool } from "../../../../../generated/schema";
import { MasterChef } from "../../common/constants";
import { createMasterChefStakingPool, updateMasterChefTotalAllocation } from "../../common/helpers";
import { updateMasterChefDeposit, updateMasterChefWithdraw } from "../../common/handlers/handleRewardV2";

export function handleDeposit(event: Deposit): void {
  updateMasterChefDeposit(event, event.params.pid, event.params.amount);
}

export function handleWithdraw(event: Withdraw): void {
  updateMasterChefWithdraw(event, event.params.pid, event.params.amount)
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  updateMasterChefWithdraw(event, event.params.pid, event.params.amount)
}

export function handleLogPoolAddition(event: LogPoolAddition): void {
  let masterChefPool = createMasterChefStakingPool(event, MasterChef.MASTERCHEFV2, event.params.pid, event.params.lpToken);
  updateMasterChefTotalAllocation(event, masterChefPool.poolAllocPoint, event.params.allocPoint, MasterChef.MASTERCHEFV2);
  masterChefPool.poolAllocPoint = event.params.allocPoint;
  masterChefPool.save();
}

export function handleLogSetPool(event: LogSetPool): void {
  let masterChefPool = _MasterChefStakingPool.load(MasterChef.MASTERCHEFV2 + "-" + event.params.pid.toString())!
  updateMasterChefTotalAllocation(event, masterChefPool.poolAllocPoint, event.params.allocPoint, MasterChef.MASTERCHEFV2);
  masterChefPool.poolAllocPoint = event.params.allocPoint;
  masterChefPool.save();
}

// export function handleHarvest(event: Harvest): void {
//  updateMasterChefHarvest(event, event.params.pid, event.params.amount)
// }
