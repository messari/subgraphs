import {
  UpdatePoolCall
} from "../../generated/Yield/Yield";
import {
  UpdatePoolCall as UpdatePoolCallV2
} from "../../generated/Yield/YieldV2";
import { handleReward, handleRewardV2 } from "../helpers/yield";

export function handleUpdatePool(call: UpdatePoolCall): void {
  let pid = call.inputs._pid;
  handleReward(call, pid);
}

export function handleUpdatePoolV2(call: UpdatePoolCallV2): void {
  let pid = call.inputs.pid;
  handleRewardV2(call, pid);
}

