import {
  BigDecimal,
  BigInt,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";
import { handleRewardPaidStakedImpl, handleStakedImpl, handleWithdrawnImpl } from "../../../common/masterChef/ubeswap/handleReward";


export function handleStaked(
  event: ethereum.Event,
  address: Address,
  amount: BigInt
): void {
    handleStakedImpl(event,address,amount);
}

export function handlWithdrawn(
  event: ethereum.Event,
  address: Address,
  amount: BigInt
): void {
    handleWithdrawnImpl(event,address,amount);
}

export function handleRewardPaidStaked(
  event: ethereum.Event,
  address: Address,
  amount: BigInt
): void {
    handleRewardPaidStakedImpl(event,address,amount);
}
