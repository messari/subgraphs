import { BigInt } from "@graphprotocol/graph-ts";

export class RewardType {
  private _strategistReward: BigInt;
  private _totalSharesMinted: BigInt;
  private _totalFee: BigInt;

  constructor(strategistReward: BigInt, totalSharesMinted: BigInt, totalFee: BigInt) {
    this._strategistReward = strategistReward;
    this._totalSharesMinted = totalSharesMinted;
    this._totalFee = totalFee;
  }

  get strategistReward(): BigInt {
    return this._strategistReward;
  }

  get totalSharesMinted(): BigInt {
    return this._totalSharesMinted;
  }

  get totalFee(): BigInt {
    return this._totalFee;
  }
}
