import * as constants from "./constants";
import { BigDecimal } from "@graphprotocol/graph-ts";

export class Wrapped<T> {
  inner: T;

  constructor(inner: T) {
    this.inner = inner;
  }
}

export class CustomPriceType {
  // `null` indicates a reverted call.
  private _usdPrice: Wrapped<BigDecimal>;
  private _decimals: Wrapped<i32>;

  constructor() {
    this._usdPrice = new Wrapped(constants.BIGDECIMAL_ZERO);
    this._decimals = new Wrapped(constants.BIGINT_ZERO.toI32() as u8);
  }

  static initialize(_usdPrice: BigDecimal, _decimals: i32 = 0): CustomPriceType {
    let result = new CustomPriceType();
    result._usdPrice = new Wrapped(_usdPrice);
    result._decimals = new Wrapped(_decimals as u8);

    return result;
  }

  get reverted(): bool {
    return this._usdPrice.inner == constants.BIGDECIMAL_ZERO;
  }

  get usdPrice(): BigDecimal {
    return changetype<Wrapped<BigDecimal>>(this._usdPrice).inner;
  }

  get decimals(): i32 {
    return changetype<Wrapped<i32>>(this._decimals).inner;
  }

  get decimalsBaseTen(): BigDecimal {
    return constants.BIGINT_TEN.pow(this.decimals as u8).toBigDecimal();
  }
}