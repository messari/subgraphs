import { QueueNewRewardsCall } from "../generated/templates/PoolCrvRewards/BaseRewardPool";
import { dataSource } from "@graphprotocol/graph-ts";
import { PoolReward } from "../generated/schema";

export function handleNewRewardsQueued(call: QueueNewRewardsCall): void {
  const context = dataSource.context();
  const reward = new PoolReward(
    call.transaction.hash.toHexString() + "-" + call.to.toHexString()
  );
  reward.poolid = context.getString("pid");
  reward.crvRewards = call.inputs._rewards;
  reward.timestamp = call.block.timestamp;
  reward.contract = call.to;
  reward.save();
}
