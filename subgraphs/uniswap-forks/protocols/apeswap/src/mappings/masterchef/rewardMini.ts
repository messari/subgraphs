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

export function handleLogBananaPerSecond(event: LogBananaPerSecond): void {
  let miniChefPool = getOrCreateMasterChef(event, MasterChef.MINICHEF);
  miniChefPool.rewardTokenRate = event.params.bananaPerSecond;
  miniChefPool.adjustedRewardTokenRate = event.params.bananaPerSecond;
  miniChefPool.save();
}
