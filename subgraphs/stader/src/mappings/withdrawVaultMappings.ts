import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { DistributedRewards } from "../../generated/templates/WithdrawVault/WithdrawVault";

export function handleDistributedRewards(event: DistributedRewards): void {
  const userShare = event.params.userShare;
  const operatorShare = event.params.operatorShare;
  const protocolShare = event.params.protocolShare;

  const sdk = initializeSDKFromEvent(event);

  const pool = getOrCreatePool(
    Address.fromString(constants.STAKING_POOL_MANAGER_ADDRESS),
    sdk
  );

  const ethToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(constants.ETH_ADDRESS)
  );

  const supplySideRevenue = userShare.plus(operatorShare);
  const protocolSideRevenue = protocolShare;

  pool.addRevenueNative(ethToken, supplySideRevenue, protocolSideRevenue);
}
