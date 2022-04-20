import * as constants from "./constants";
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export class Wrapped<T> {
  inner: T;

  constructor(inner: T) {
    this.inner = inner;
  }
}

export class CustomPriceType {
  // `null` indicates a reverted call.
  private _usdPrice: Wrapped<BigDecimal>;
  private _decimals: Wrapped<BigInt>;

  constructor() {
    this._usdPrice = new Wrapped(constants.BIGDECIMAL_ZERO);
    this._decimals = new Wrapped(
      constants.BIGINT_TEN.pow(constants.BIGINT_ZERO.toI32() as u8)
    );
  }

  static initialize(
    _usdPrice: BigDecimal,
    _decimals: BigInt = constants.BIGINT_ZERO
  ): CustomPriceType {
    let result = new CustomPriceType();
    result._usdPrice = new Wrapped(_usdPrice);
    result._decimals = new Wrapped(
      constants.BIGINT_TEN.pow(_decimals.toI32() as u8)
    );

    return result;
  }

  get reverted(): bool {
    return this._usdPrice.inner == constants.BIGDECIMAL_ZERO;
  }

  get usdPrice(): BigDecimal {
    return changetype<Wrapped<BigDecimal>>(this._usdPrice).inner;
  }

  get decimals(): BigInt {
    return changetype<Wrapped<BigInt>>(this._decimals).inner;
  }
}
