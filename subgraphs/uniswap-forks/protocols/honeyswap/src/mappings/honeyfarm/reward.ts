import { PoolAdded as PoolAddedEvent, PoolRemoved as PoolRemovedEvent, RewardsWithdraw as RewardsWithdrawEvent, Transfer as TransferEvent} from "../../../../../generated/HoneyFarm/HoneyFarm";
import { createPoolRewardToken, removePoolRewardToken } from "../../common/creators";
import { UsageType, ZERO_ADDRESS } from "../../../../../src/common/constants";
import { handleReward } from "../../common/handlers";

export function handlePoolAdded(event: PoolAddedEvent): void {
  createPoolRewardToken(event.params.poolToken.toHexString());
}

export function handlePoolRemoved(event: PoolRemovedEvent): void {
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
