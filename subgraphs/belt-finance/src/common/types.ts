import * as constants from "../common/constants";
import { VaultFee } from "../../generated/schema";
import { BigDecimal } from "@graphprotocol/graph-ts";

export class PoolFeesType {
  private _depositFees: VaultFee;
  private _withdrawalFees: VaultFee;
  private _performanceFees: VaultFee;

  constructor(
    depositFees: VaultFee,
    withdrawalFees: VaultFee,
    performanceFees: VaultFee
  ) {
    this._depositFees = depositFees;
    this._withdrawalFees = withdrawalFees;
    this._performanceFees = performanceFees;
  }

  get getDepositFeesId(): string {
    return this._depositFees.id;
  }
  get getWithdrawalFeesId(): string {
    return this._withdrawalFees.id;
  }
  get getPerformanceFeesId(): string {
    return this._performanceFees.id;
  }

  get getDepositFees(): BigDecimal {
    return this._depositFees.feePercentage!.div(constants.BIGDECIMAL_HUNDRED);
  }
  get getWithdrawalFees(): BigDecimal {
    return this._withdrawalFees.feePercentage!.div(
      constants.BIGDECIMAL_HUNDRED
    );
  }
  get getPerformanceFees(): BigDecimal {
    return this._performanceFees.feePercentage!.div(
      constants.BIGDECIMAL_HUNDRED
    );
  }

  stringIds(): string[] {
    return [
      this.getDepositFeesId,
      this.getWithdrawalFeesId,
      this.getPerformanceFeesId,
    ];
  }
}
