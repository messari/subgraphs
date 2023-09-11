import * as constants from "./constants";
import { LiquidityPoolFee } from "../../generated/schema";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Gauge as LiquidityGaugeContract } from "../../generated/templates/LiquidityGauge/Gauge";

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

export class RewardData {
  private _rewardToken: Address;
  private _rewardRate: BigInt;
  private _periodFinish: BigInt;

  constructor(gaugeAddress: Address, rewardToken: Address) {
    const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

    const rewardDataV1 = gaugeContract.try_reward_data(rewardToken);
    if (rewardDataV1.reverted) {
      const rewardDataV2 = gaugeContract.try_reward_data1(rewardToken);

      if (rewardDataV2.reverted) {
        this._rewardToken = constants.NULL.TYPE_ADDRESS;
        this._rewardRate = constants.BIGINT_ZERO;
        this._periodFinish = constants.BIGINT_ZERO;
      } else {
        this._rewardToken = rewardToken;
        this._rewardRate = rewardDataV2.value.rate;
        this._periodFinish = rewardDataV2.value.period_finish;
      }
    } else {
      this._rewardToken = rewardDataV1.value.getToken();
      this._rewardRate = rewardDataV1.value.getRate();
      this._periodFinish = rewardDataV1.value.getPeriod_finish();
    }
  }

  get getRewardToken(): Address {
    return this._rewardToken;
  }
  get getRewardRate(): BigInt {
    return this._rewardRate;
  }
  get getPeriodFinish(): BigInt {
    return this._periodFinish;
  }

  isReverted(): bool {
    if (this.getRewardToken.equals(constants.NULL.TYPE_ADDRESS)) return true;

    return false;
  }
}

export class PoolFeesType {
  private _tradingFee: LiquidityPoolFee;
  private _protocolFee: LiquidityPoolFee;
  private _lpFee: LiquidityPoolFee;

  constructor(
    tradingFee: LiquidityPoolFee,
    protocolFee: LiquidityPoolFee,
    lpFee: LiquidityPoolFee
  ) {
    this._tradingFee = tradingFee;
    this._protocolFee = protocolFee;
    this._lpFee = lpFee;
  }

  get getTradingFeeId(): string {
    return this._tradingFee.id;
  }
  get getProtocolFeeId(): string {
    return this._protocolFee.id;
  }
  get getLpFeeId(): string {
    return this._lpFee.id;
  }

  get getTradingFees(): BigDecimal {
    return this._tradingFee.feePercentage!.div(constants.BIGDECIMAL_HUNDRED);
  }
  get getProtocolFees(): BigDecimal {
    return this._protocolFee.feePercentage!.div(constants.BIGDECIMAL_HUNDRED);
  }
  get getLpFees(): BigDecimal {
    return this._lpFee.feePercentage!.div(constants.BIGDECIMAL_HUNDRED);
  }

  stringIds(): string[] {
    return [this.getTradingFeeId, this.getProtocolFeeId, this.getLpFeeId];
  }
}
