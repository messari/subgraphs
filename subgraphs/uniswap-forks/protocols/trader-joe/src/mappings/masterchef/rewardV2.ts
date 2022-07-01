// import { log } from "@graphprotocol/graph-ts";
import { log } from "@graphprotocol/graph-ts";
import {
  Deposit,
  Withdraw,
  EmergencyWithdraw,
  Add,
  Set,
  UpdateEmissionRate,
} from "../../../../../generated/MasterChefV2/MasterChefV2TraderJoe";
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

export function handleAdd(event: Add): void {
  log.warning("HELLO", []);
  let masterChefV2Pool = createMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEFV2,
    event.params.pid,
    event.params.lpToken
  );
  updateMasterChefTotalAllocation(
    event,
    masterChefV2Pool.poolAllocPoint,
    event.params.allocPoint,
    MasterChef.MASTERCHEFV2
  );
  masterChefV2Pool.poolAllocPoint = event.params.allocPoint;
  masterChefV2Pool.save();
}

export function handleSet(event: Set): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(
    MasterChef.MASTERCHEFV2 + "-" + event.params.pid.toString()
  )!;
  updateMasterChefTotalAllocation(
    event,
    masterChefV2Pool.poolAllocPoint,
    event.params.allocPoint,
    MasterChef.MASTERCHEFV2
  );
  masterChefV2Pool.poolAllocPoint = event.params.allocPoint;
  masterChefV2Pool.save();
}

export function handleUpdateEmissionRate(event: UpdateEmissionRate): void {
  let masterChefV2Pool = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);
  let masterChefV3Pool = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV3);

  log.warning("NEW REWARD RATE: " + event.params._joePerSec.toString(), []);

  masterChefV2Pool.rewardTokenRate = event.params._joePerSec;
  masterChefV2Pool.adjustedRewardTokenRate = event.params._joePerSec;

  masterChefV3Pool.rewardTokenRate = event.params._joePerSec;

  masterChefV2Pool.save();
  masterChefV3Pool.save();
}
