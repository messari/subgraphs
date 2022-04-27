import {
  Add,
  Deposit,
  DepositFor,
  EmergencyWithdraw,
  Harvest,
  OwnershipTransferred,
  Paused,
  Set,
  Unpaused,
  UpdateEmissionRate,
  UpdateEmissionRepartition,
  UpdatePool,
  UpdateVePTP,
  Withdraw,
} from "../../generated/MasterPlatypus/MasterPlatypus";

export function handleAdd(event: Add): void {}
export function handleDeposit(event: Deposit): void {}
export function handleDepositFor(event: DepositFor): void {}
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {}
export function handleHarvest(event: Harvest): void {}
export function handleOwnershipTransferred(event: OwnershipTransferred): void {}
export function handlePaused(event: Paused): void {}
export function handleSet(event: Set): void {}
export function handleUnpaused(event: Unpaused): void {}
export function handleUpdateEmissionRate(event: UpdateEmissionRate): void {}
export function handleUpdateEmissionRepartition(event: UpdateEmissionRepartition): void {}
export function handleUpdatePool(event: UpdatePool): void {}
export function handleUpdateVePTP(event: UpdateVePTP): void {}
export function handleWithdraw(event: Withdraw): void {}
