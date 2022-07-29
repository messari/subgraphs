import { Address, BigInt } from "@graphprotocol/graph-ts";

export class RewardsInfoType {
  private _rewardTokens: Address[];
  private _rewardRates: BigInt[];

  constructor(
    rewardTokens: Address[],
    rewardRates: BigInt[],
  ) {
    this._rewardTokens = rewardTokens;
    this._rewardRates = rewardRates;
  }

  get getRewardTokens(): Address[] {
    return this._rewardTokens;
  }
  get getRewardRates(): BigInt[] {
    return this._rewardRates;
  }

  isEmpty(): bool {
    if (this.getRewardTokens.length === 0) return true;

    return false;
  }
}
