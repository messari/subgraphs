import {
  Deposit,
  Withdraw,
  EmergencyWithdraw,
} from "../../generated/Staking/Staking";
import {
  Deposit as DepositV2,
  Withdraw as WithdrawV2,
  EmergencyWithdraw as EmergencyWithdrawV2,
  StakingV2 as StakingContractV2,
} from "../../generated/StakingV2/StakingV2";

import * as constants from "../common/constants";
import { handleStaking, handleStakingV2 } from "../modules/Rewards";

export function handleDeposit(event: Deposit): void {
  
  let poolId = event.params.pid;
    let amount = event.params.amount;
    handleStaking(constants.UsageType.DEPOSIT, event.block, poolId, event.address, amount);
  
}
export function handleWithdraw(event: Withdraw): void {
  let poolId = event.params.pid;
    let amount = event.params.amount;
    handleStaking(constants.UsageType.WITHDRAW, event.block, poolId, event.address, amount);
  
}
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  let poolId = event.params.pid;
    let amount = event.params.amount;
    handleStaking(constants.UsageType.WITHDRAW, event.block, poolId, event.address, amount);
  
}
export function handleDepositV2(event: DepositV2): void {
    let amount = event.params.amount;
    let token = event.params.token;
    handleStakingV2(constants.UsageType.DEPOSIT, event.block, event.address, amount, token);
    
}
export function handleWithdrawV2(event: WithdrawV2): void {
let amount = event.params.amount;
    let token = event.params.token;
    handleStakingV2(constants.UsageType.WITHDRAW, event.block, event.address, amount, token);
    
}
export function handleEmergencyWithdrawV2(event: EmergencyWithdrawV2): void {
    let amount = event.params.amount;
    let token = event.params.token;
    handleStakingV2(constants.UsageType.WITHDRAW , event.block, event.address, amount, token);
    
}
