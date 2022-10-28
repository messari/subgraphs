import {
  NotifyPoolsCall,
  NotifyPoolsIncludingProfitShareCall,
} from '../generated/NotifyHelper/NotifyHelper'

import { rewardTokens } from './utils/rewardTokens'

export function handleNotifyPools(call: NotifyPoolsCall): void {
  rewardTokens.updateRewardTokenInfo(call.inputs.pools)
}

export function handleNotifyPoolsIncludingProfitShare(
  call: NotifyPoolsIncludingProfitShareCall
): void {
  rewardTokens.updateRewardTokenInfo(call.inputs.pools)
}
