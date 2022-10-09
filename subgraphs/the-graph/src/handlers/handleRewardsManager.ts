import { RewardsAssigned } from "../../generated/RewardsManager/RewardsManager";
import { getDelegatorCut } from "../common/helpers";
import {
  updateSupplySideRewards,
  updateTVL,
  updateUsageMetrics,
} from "../common/updateMetrics";

/*
 * Contracts
 * https://github.com/graphprotocol/contracts/blob/dev/contracts/rewards/RewardsManager.sol
 */

/** 
    * @dev Emitted when rewards are assigned to an indexer.
    
    event.params.allocationID;
    event.params.amount;
    event.params.epoch;
    event.params.indexer;
*/
export function handleRewardsAssigned(event: RewardsAssigned): void {
  // Indexer rewards that are restaked will be caught by the handleStakeDeposited event.
  const delegatorCut = getDelegatorCut(
    event,
    event.params.indexer,
    event.params.amount
  );
  updateTVL(event, delegatorCut);
  updateSupplySideRewards(event, event.params.amount);
  updateUsageMetrics(event, event.params.indexer);
}
