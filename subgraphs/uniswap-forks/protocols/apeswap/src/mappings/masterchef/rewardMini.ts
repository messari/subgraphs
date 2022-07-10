import {
  Deposit,
  Withdraw,
  EmergencyWithdraw,
  LogPoolAddition,
  LogSetPool,
  LogBananaPerSecond,
} from "../../../../../generated/MiniChefV2/MiniChefV2Apeswap";
import {
  _HelperStore,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { MasterChef } from "../../../../../src/common/constants";
import {
  updateMasterChefDeposit,
  updateMasterChefWithdraw,
} from "../../common/handlers/handleRewardMini";
import {
  createMasterChefStakingPool,
  getOrCreateMasterChef,
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

// Update the allocation points of the pool.
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

// Update the total emissions rate of rewards for the masterchef contract.
export function handleLogBananaPerSecond(event: LogBananaPerSecond): void {
  let miniChefPool = getOrCreateMasterChef(event, MasterChef.MINICHEF);
  miniChefPool.rewardTokenRate = event.params.bananaPerSecond;
  miniChefPool.adjustedRewardTokenRate = event.params.bananaPerSecond;
  miniChefPool.save();
}
