import { Staker } from "../../generated/schema";

export class TransactionStakers {
  fromStaker: Staker;
  toStaker: Staker;

  constructor(from: Staker, to: Staker) {
    this.fromStaker = from;
    this.toStaker = to;
  }
}
