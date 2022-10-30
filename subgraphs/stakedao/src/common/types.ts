import * as constants from "./constants";
import { VaultFee } from "../../generated/schema";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export class RewardsInfoType {
  private _rewardTokens: Address[];
  private _rewardRates: BigInt[];

  constructor(rewardTokens: Address[], rewardRates: BigInt[]) {
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

export class PoolFeesType {
  private _withdrawalFee: VaultFee;
  private _performanceFee: VaultFee;

  constructor(withdrawalFee: VaultFee, performanceFee: VaultFee) {
    this._withdrawalFee = withdrawalFee;
    this._performanceFee = performanceFee;
  }

  get getWithdrawalFeeId(): string {
    return this._withdrawalFee.id;
  }
  get getPerformanceFeeId(): string {
    return this._performanceFee.id;
  }

  get getWithdrawalFees(): BigDecimal {
    return this._withdrawalFee.feePercentage!.div(constants.BIGDECIMAL_HUNDRED);
  }
  get getPerformanceFees(): BigDecimal {
    return this._performanceFee.feePercentage!.div(
      constants.BIGDECIMAL_HUNDRED
    );
  }

  stringIds(): string[] {
    return [this.getWithdrawalFeeId, this.getPerformanceFeeId];
  }
}
