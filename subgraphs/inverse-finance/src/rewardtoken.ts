import { Address } from "@graphprotocol/graph-ts";
import { RewardToken } from "../generated/schema";
import { INV, OwnerChanged } from "../generated/INV/INV";
import { ZERO_ADDRESS, RewardTokenType } from "./common/constants";
import { prefixID } from "./common/utils";

export function handleOwnerChanged(event: OwnerChanged): void {
  // this only happens when the constructor() of the INV contract is called
  if (event.params.owner == Address.fromString(ZERO_ADDRESS)) {
    let tokenAddr = event.address.toHexString()

    let depositTokenId = prefixID(tokenAddr, RewardTokenType.DEPOSIT);
    let depositRewardToken = RewardToken.load(depositTokenId);

    if (depositRewardToken == null) {
      depositRewardToken = new RewardToken(depositTokenId);
      depositRewardToken.token = tokenAddr;
      depositRewardToken.type = RewardTokenType.DEPOSIT;
    }

    depositRewardToken.save();

    let borrowTokenId = prefixID(tokenAddr, RewardTokenType.BORROW);
    let borrowRewardToken = RewardToken.load(borrowTokenId);

    if (borrowRewardToken == null) {
      borrowRewardToken = new RewardToken(borrowTokenId);
      borrowRewardToken.token = tokenAddr;
      borrowRewardToken.type = RewardTokenType.BORROW;
    }

    borrowRewardToken.save();
  }
}
