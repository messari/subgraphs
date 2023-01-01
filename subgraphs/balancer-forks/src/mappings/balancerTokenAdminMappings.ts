import * as constants from "../common/constants";
import { getRewardsPerDay } from "../common/rewards";
import { BigDecimal } from "@graphprotocol/graph-ts";
import { getOrCreateRewardToken } from "../common/initializers";
import { MiningParametersUpdated } from "../../generated/BalancerTokenAdmin/BalancerTokenAdmin";

export function handleMiningParametersUpdated(
  event: MiningParametersUpdated
): void {
  const protocolToken = getOrCreateRewardToken(
    constants.PROTOCOL_TOKEN_ADDRESS,
    constants.RewardTokenType.DEPOSIT,
    event.block
  );
  protocolToken._inflationRate = BigDecimal.fromString(
    event.params.rate.toString()
  );
  protocolToken._inflationPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    protocolToken._inflationRate!,
    constants.INFLATION_INTERVAL
  );
  protocolToken.save();
}
