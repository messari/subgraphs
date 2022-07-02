import { PoolAdded as PoolAddedEvent, PoolRemoved as PoolRemovedEvent, Transfer as TransferEvent} from "../../../../../generated/HoneyFarm/HoneyFarm";
import { createPoolRewardToken, removePoolRewardToken } from "../../common/creators";
import { UsageType, ZERO_ADDRESS } from "../../../../../src/common/constants";
import { handleReward } from "../../common/handlers";
import { log } from "@graphprotocol/graph-ts";

export function handlePoolAdded(event: PoolAddedEvent): void {
  log.warning("poolToken added: {}", [event.params.poolToken.toHexString()]);
  createPoolRewardToken(event.params.poolToken.toHexString());
}

export function handlePoolRemoved(event: PoolRemovedEvent): void {
  log.warning("poolToken removed: {}", [event.params.poolToken.toHexString()]);
  removePoolRewardToken(event.params.poolToken.toHexString());
}

export function handleTransfer(event: TransferEvent): void {
  // mint event representing creating a deposit (deposit event)
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleReward(event, event.params.tokenId, UsageType.DEPOSIT);
  }

  // burn event representing closing a deposit (withdraw event)
  if (event.params.to.toHexString() == ZERO_ADDRESS && event.params.from == event.address) {
    handleReward(event, event.params.tokenId, UsageType.WITHDRAW);
  }
}
