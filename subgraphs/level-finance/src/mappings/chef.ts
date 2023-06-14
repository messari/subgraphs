import {
  Deposit,
  Withdraw,
  Harvest,
} from "../../generated/LevelMaster/LevelMaster";

// A deposit or stake for the pool specific MasterChef.
export function handleDeposit(event: Deposit): void {}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleWithdraw(event: Withdraw): void {}

// Update the allocation points of the pool.
export function handleHarvest(event: Harvest): void {}
