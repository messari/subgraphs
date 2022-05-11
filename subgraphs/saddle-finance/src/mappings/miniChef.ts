import { BigInt } from "@graphprotocol/graph-ts";
import {
  MiniChefV2,
  Deposit,
  EmergencyWithdraw,
  LogPoolAddition,
  LogSaddlePerSecond,
  LogSetPool,
  Withdraw,
} from "../../generated/MiniChefV2/MiniChefV2";
import { handlePoolRewardsUpdated } from "../entities/pool";
import { BIGINT_ZERO } from "../utils/constants";

export function handleDeposit(event: Deposit): void {
  const contract = MiniChefV2.bind(event.address);
  handlePoolRewardsUpdated(
    event,
    contract,
    event.params.pid,
    event.params.amount
  );
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  const contract = MiniChefV2.bind(event.address);
  handlePoolRewardsUpdated(
    event,
    contract,
    event.params.pid,
    BIGINT_ZERO.minus(event.params.amount)
  );
}

export function handleLogPoolAddition(event: LogPoolAddition): void {
  const contract = MiniChefV2.bind(event.address);
  handlePoolRewardsUpdated(event, contract, event.params.pid);
}

export function handleLogSaddlePerSecond(event: LogSaddlePerSecond): void {
  const contract = MiniChefV2.bind(event.address);
  const length = contract.poolLength().toI32();
  for (let pid = 0; pid < length; pid++) {
    handlePoolRewardsUpdated(event, contract, BigInt.fromI32(pid));
  }
}

export function handleLogSetPool(event: LogSetPool): void {
  const contract = MiniChefV2.bind(event.address);
  handlePoolRewardsUpdated(event, contract, event.params.pid);
}

export function handleWithdraw(event: Withdraw): void {
  const contract = MiniChefV2.bind(event.address);
  handlePoolRewardsUpdated(
    event,
    contract,
    event.params.pid,
    BIGINT_ZERO.minus(event.params.amount)
  );
}
