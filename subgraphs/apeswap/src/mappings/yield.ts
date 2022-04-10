import {
  UpdatePoolCall
} from "../../generated/Yield/Yield";
import {
  UpdatePoolCall as UpdatePoolCallV2
} from "../../generated/Yield/YieldV2";
import { handleReward, handleRewardV2 } from "../helpers/yield";

export function handleDeposit(call: UpdatePoolCall): void {
  let pid = call.inputs._pid;
  handleReward(call, pid);
}

export function handleDepositV2(call: UpdatePoolCallV2): void {
  let pid = call.inputs.pid;
  handleRewardV2(call, pid);
}

