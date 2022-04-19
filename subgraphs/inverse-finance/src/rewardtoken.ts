import { Address } from "@graphprotocol/graph-ts";
import { RewardToken } from "../generated/schema";
import { INV, OwnerChanged } from "../generated/INV/INV";
import { ZERO_ADDRESS, RewardTokenType } from "./common/constants";
import { prefixID } from "./common/utils";

export function handleOwnerChanged(event: OwnerChanged): void {
  // this only happens when the constructor() of the INV contract is called
  if (event.params.owner == Address.fromString(ZERO_ADDRESS)) {
    let tokenContract = INV.bind(event.address);

    let depositTokenId = prefixID(
      RewardTokenType.DEPOSIT,
      event.address.toHexString()
    );
    let depositRewardToken = RewardToken.load(depositTokenId);

    if (depositRewardToken == null) {
      depositRewardToken = new RewardToken(depositTokenId);
      depositRewardToken.name = tokenContract.name();
      depositRewardToken.symbol = tokenContract.symbol();
      depositRewardToken.decimals = tokenContract.decimals();
      depositRewardToken.type = RewardTokenType.DEPOSIT;
    }

    depositRewardToken.save();

    let borrowTokenId = prefixID(
      RewardTokenType.BORROW,
      event.address.toHexString()
    );
    let borrowRewardToken = RewardToken.load(borrowTokenId);

    if (borrowRewardToken == null) {
      borrowRewardToken = new RewardToken(borrowTokenId);
      borrowRewardToken.name = tokenContract.name();
      borrowRewardToken.symbol = tokenContract.symbol();
      borrowRewardToken.decimals = tokenContract.decimals();
      borrowRewardToken.type = RewardTokenType.BORROW;
    }

    borrowRewardToken.save();
  }
}
