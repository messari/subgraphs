import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import {
  OperatorRewardsClaimed,
  UserETHRewardsTransferred,
  ProtocolETHRewardsTransferred,
} from "../../generated/PermissionedSocializingPool/SocializingPool";

export function handleOperatorRewardsClaimed(
  event: OperatorRewardsClaimed
): void {
  const sdTokenOperatorRewards = event.params.sdRewards;
  const ethTokenOperatorRewards = event.params.ethRewards;

  const sdk = initializeSDKFromEvent(event);

  const pool = getOrCreatePool(
    Address.fromString(constants.STAKING_POOL_MANAGER_ADDRESS),
    sdk
  );

  const ethToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(constants.ETH_ADDRESS)
  );
  const sdToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(constants.SD_TOKEN_ADDRESS)
  );

  pool.addRevenueNative(
    ethToken,
    ethTokenOperatorRewards,
    constants.BIGINT_ZERO
  );
  pool.addRevenueNative(sdToken, sdTokenOperatorRewards, constants.BIGINT_ZERO);
}

export function handleUserETHRewardsTransferred(
  event: UserETHRewardsTransferred
): void {
  const ethTokenUserRewards = event.params.ethRewards;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(
    Address.fromString(constants.STAKING_POOL_MANAGER_ADDRESS),
    sdk
  );

  const ethToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(constants.ETH_ADDRESS)
  );
  pool.addRevenueNative(ethToken, ethTokenUserRewards, constants.BIGINT_ZERO);
}

export function handleProtocolETHRewardsTransferred(
  event: ProtocolETHRewardsTransferred
): void {
  const protocolRewards = event.params.ethRewards;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(
    Address.fromString(constants.STAKING_POOL_MANAGER_ADDRESS),
    sdk
  );

  const ethToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(constants.ETH_ADDRESS)
  );
  pool.addRevenueNative(ethToken, constants.BIGINT_ZERO, protocolRewards);
}
