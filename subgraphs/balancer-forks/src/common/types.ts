import * as constants from "./constants";
import { LiquidityPoolFee } from "../../generated/schema";
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

export class PoolTokensType {
  private _tokens: Address[];
  private _balances: BigInt[];

  constructor(tokens: Address[] = [], balances: BigInt[] = []) {
    this._tokens = tokens;
    this._balances = balances;
  }

  get getInputTokens(): string[] {
    const inputTokens: string[] = [];

    for (let idx = 0; idx < this._tokens.length; idx++) {
      inputTokens.push(this._tokens.at(idx).toHexString());
    }

    return inputTokens;
  }
  get getBalances(): BigInt[] {
    return this._balances;
  }
}
