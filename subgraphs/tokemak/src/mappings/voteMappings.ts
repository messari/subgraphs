import { VoteCall } from "../../generated/OnChainVote/OnChainVote";
import { updateUsageMetrics } from "../common/usage";

export function handleUserVote(call: VoteCall): void {
  updateUsageMetrics(call.block, call.from);
}
