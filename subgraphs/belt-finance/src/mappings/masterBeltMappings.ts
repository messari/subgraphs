import {
  updateBeltRewards,
  updateStakedOutputTokenAmount,
} from "../modules/Rewards";
import * as utils from "../common/utils";
import { MasterBelt } from "../../generated/MasterBelt/MasterBelt";
import { Deposit, Withdraw } from "../../generated/MasterBelt/MasterBelt";

export function handleDeposit(event: Deposit): void {
  const pid = event.params.pid;
  const masterBeltAddress = event.address;

  const masterBeltContract = MasterBelt.bind(event.address);

  const poolInfo = masterBeltContract.try_poolInfo(pid);
  if (poolInfo.reverted) return;

  const vaultAddress = poolInfo.value.getWant();
  const allocPoint = poolInfo.value.getAllocPoint();
  const strategyAddress = poolInfo.value.getStrat();

  if (!utils.isVaultRegistered(vaultAddress)) return;

  updateStakedOutputTokenAmount(vaultAddress, strategyAddress, event.block);
  updateBeltRewards(vaultAddress, allocPoint, masterBeltAddress, event.block);
}

export function handleWithdraw(event: Withdraw): void {
  const pid = event.params.pid;
  const masterBeltAddress = event.address;

  const masterBeltContract = MasterBelt.bind(event.address);

  const poolInfo = masterBeltContract.try_poolInfo(pid);
  if (poolInfo.reverted) return;

  const vaultAddress = poolInfo.value.getWant();
  const allocPoint = poolInfo.value.getAllocPoint();
  const strategyAddress = poolInfo.value.getStrat();

  if (!utils.isVaultRegistered(vaultAddress)) return;

  updateStakedOutputTokenAmount(vaultAddress, strategyAddress, event.block);
  updateBeltRewards(vaultAddress, allocPoint, masterBeltAddress, event.block);
}
