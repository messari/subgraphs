import {
  BigDecimal,
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import { StakeCall } from "../../../../generated/templates/StakingRewards/StakingRewards";
import {
  handleRewardPaidImpl,
  handleStakedImpl,
  handleWithdrawnImpl,
} from "../../../common/masterChef/ubeswap/handleReward";

export function handleStaked(
  event: ethereum.Event,
  address: Address,
  amount: BigInt
): void {
  handleStakedImpl(event,address, amount);
}

export function handleWithdrawn(
  event: ethereum.Event,
  address: Address,
  amount: BigInt
): void {
  handleWithdrawnImpl(event, address, amount);
}

export function handleRewardPaid(
  event: ethereum.Event,
  address: Address,
  amount: BigInt
): void {
  handleRewardPaidImpl(event, address, amount);
}
