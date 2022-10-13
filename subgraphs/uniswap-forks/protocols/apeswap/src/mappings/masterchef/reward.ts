import {
  Deposit,
  Withdraw,
  EmergencyWithdraw,
} from "../../../../../generated/MasterChef/MasterChefApeswap";
import { BIGINT_NEG_ONE } from "../../../../../src/common/constants";
import { handleReward } from "../../common/handlers/handleReward";

// A deposit or stake for the pool specific MasterChef.
export function handleDeposit(event: Deposit): void {
  handleReward(event, event.params.pid, event.params.amount);
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleWithdraw(event: Withdraw): void {
  handleReward(
    event,
    event.params.pid,
    event.params.amount.times(BIGINT_NEG_ONE)
  );
}

// A withdraw or unstaking for the pool specific MasterChef.
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  handleReward(
    event,
    event.params.pid,
    event.params.amount.times(BIGINT_NEG_ONE)
  );
}

// export function logPoolAddition(event: LogPoolAddition): void {
//   let pidPoolMapping = new _HelperStore(event.params.pid.toString());
//   pidPoolMapping.valueString = event.params.lpToken.toHexString();
//   pidPoolMapping.save();
// }
// export function logPoolAdditionV2(event: LogPoolAdditionV2): void {
//   let pidPoolMapping = new _HelperStore(event.params.pid.toString());
//   pidPoolMapping.valueString = event.params.lpToken.toHexString();
//   pidPoolMapping.save();
// }
