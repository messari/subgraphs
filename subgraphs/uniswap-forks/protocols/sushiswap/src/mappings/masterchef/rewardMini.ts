// import { log } from "@graphprotocol/graph-ts";
import {
  Deposit,
  EmergencyWithdraw,
  LogPoolAddition,
  LogSetPool,
  LogSushiPerSecond,
  Withdraw,
} from "../../../../../generated/MiniChef/MiniChefSushiswap";
import {
  _HelperStore,
  _MasterChef,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { MasterChef } from "../../common/constants";
import {
  createMasterChefStakingPool,
  getOrCreateMasterChef,
  updateMasterChefTotalAllocation,
} from "../../common/helpers";
import {
  updateMasterChefDeposit,
  updateMasterChefWithdraw,
} from "../../common/handlers/handleRewardMini";
import { log } from "@graphprotocol/graph-ts";

export function handleDeposit(event: Deposit): void {
  updateMasterChefDeposit(event, event.params.pid, event.params.amount);
}

export function handleWithdraw(event: Withdraw): void {
  updateMasterChefWithdraw(event, event.params.pid, event.params.amount);
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  updateMasterChefWithdraw(event, event.params.pid, event.params.amount);
}

export function handleLogPoolAddition(event: LogPoolAddition): void {
  let miniChefPool = createMasterChefStakingPool(
    event,
    MasterChef.MINICHEF,
    event.params.pid,
    event.params.lpToken
  );
  updateMasterChefTotalAllocation(
    event,
    miniChefPool.poolAllocPoint,
    event.params.allocPoint,
    MasterChef.MINICHEF
  );
  miniChefPool.poolAllocPoint = event.params.allocPoint;
  miniChefPool.save();
}

export function handleLogSetPool(event: LogSetPool): void {
  let miniChefPool = _MasterChefStakingPool.load(
    MasterChef.MINICHEF + "-" + event.params.pid.toString()
  )!;
  updateMasterChefTotalAllocation(
    event,
    miniChefPool.poolAllocPoint,
    event.params.allocPoint,
    MasterChef.MINICHEF
  );
  miniChefPool.poolAllocPoint = event.params.allocPoint;
  miniChefPool.save();
}

export function handleLogSushiPerSecond(event: LogSushiPerSecond): void {
  let miniChefPool = getOrCreateMasterChef(event, MasterChef.MINICHEF);
  miniChefPool.rewardTokenRate = event.params.sushiPerSecond;
  miniChefPool.adjustedRewardTokenRate = event.params.sushiPerSecond;
  miniChefPool.save();
}

// export function handleHarvest(event: Harvest): void {
//  updateMasterChefHarvest(event, event.params.pid, event.params.amount)
// }
