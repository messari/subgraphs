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
import {
  BIGINT_NEG_ONE,
  MasterChef,
} from "../../../../../src/common/constants";
import { updateMasterChef } from "../../common/handlers/handleRewardV2";
import {
  createMasterChefStakingPool,
  getOrCreateMasterChef,
  updateMasterChefTotalAllocation,
} from "../../../../../src/common/masterchef/helpers";

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
export function handleAdd(event: Add): void {
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

// Update the allocation points of the pool.
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

// Update the total emissions rate of rewards for the masterchef contract.
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
