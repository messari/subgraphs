// import { log } from "@graphprotocol/graph-ts";
import {
  Deposit,
  EmergencyWithdraw,
  PoolAdded,
  PoolSet,
  LogRewardPerSecond,
  Withdraw,
  MiniChefV2,
} from "../../../../../generated/MiniChef/MiniChefV2";
import { _MasterChefStakingPool } from "../../../../../generated/schema";
import {
  createMasterChefStakingPool,
  getOrCreateMasterChef,
  updateMasterChefTotalAllocation,
} from "../../../../../src/common/masterchef/helpers";
import { updateMasterChef } from "../../common/handlers/handleRewardMini";
import {
  BIGINT_NEG_ONE,
  BIGINT_ZERO,
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
export function handlePoolAdded(event: PoolAdded): void {
  const miniChefPool = createMasterChefStakingPool(
    event,
    MasterChef.MINICHEF,
    event.params.pid,
    event.params.lpToken
  );
  const masterchef = getOrCreateMasterChef(event, MasterChef.MINICHEF);
  if (masterchef.lastUpdatedRewardRate == BIGINT_ZERO) {
    masterchef.lastUpdatedRewardRate = event.block.number;
    const miniChefV2Contract = MiniChefV2.bind(event.address);
    masterchef.adjustedRewardTokenRate = miniChefV2Contract.rewardPerSecond();
    masterchef.save();
  }
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
export function handlePoolSet(event: PoolSet): void {
  const miniChefPool = _MasterChefStakingPool.load(
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
export function handleLogRewardPerSecond(event: LogRewardPerSecond): void {
  const miniChefPool = getOrCreateMasterChef(event, MasterChef.MINICHEF);
  miniChefPool.rewardTokenRate = event.params.rewardPerSecond;
  miniChefPool.adjustedRewardTokenRate = event.params.rewardPerSecond;
  miniChefPool.save();
}

// export function handleHarvest(event: Harvest): void {
//  updateMasterChefHarvest(event, event.params.pid, event.params.amount)
// }
