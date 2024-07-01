import {
  getOrCreatePool,
  initializeSDKFromEvent,
  getRestakeManagerAddress,
} from "../common/initializers";
import {
  ProtocolFeesPaid,
  RewardsDeposited,
} from "../../generated/DepositQueue/DepositQueue";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";

export function handleProtocolFeesPaid(event: ProtocolFeesPaid): void {
  const protocolFeesAmount = event.params.amount;
  // For ETH native rewards, the token address is NULL address
  // Ref: https://github.com/Renzo-Protocol/contracts-public/blob/master/contracts/Deposits/DepositQueue.sol#L168
  const rewardTokenAddress =
    event.params.token.toHexString() == constants.ZERO_ADDRESS
      ? Address.fromString(constants.ETH_ADDRESS)
      : event.params.token;

  const restakeManagerAddress = getRestakeManagerAddress(event.address);

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(restakeManagerAddress, sdk);

  const rewardToken = sdk.Tokens.getOrCreateToken(rewardTokenAddress);
  pool.addRevenueNative(rewardToken, constants.BIGINT_ZERO, protocolFeesAmount);
}

export function handleRewardsDeposited(event: RewardsDeposited): void {
  const rewardsAmount = event.params.amount;
  // For ETH native rewards, the token address is NULL address
  // Ref: https://github.com/Renzo-Protocol/contracts-public/blob/master/contracts/Deposits/DepositQueue.sol#L176
  const rewardTokenAddress =
    event.params.token.toHexString() == constants.ZERO_ADDRESS
      ? Address.fromString(constants.ETH_ADDRESS)
      : event.params.token;

  const restakeManagerAddress = getRestakeManagerAddress(event.address);

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(restakeManagerAddress, sdk);

  const rewardToken = sdk.Tokens.getOrCreateToken(rewardTokenAddress);
  pool.addRevenueNative(rewardToken, rewardsAmount, constants.BIGINT_ZERO);
}
