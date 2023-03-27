import * as constants from "./constants";
import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";

export class Wrapped<T> {
  inner: T;

  constructor(inner: T) {
    this.inner = inner;
  }
}

export class TokenInfo {
  private _name: string;
  private _decimals: i32;
  private _address: Address;
  private _isStable: bool;

  constructor() {
    this._name = "";
    this._decimals = constants.DEFAULT_USDC_DECIMALS;
    this._address = constants.NULL.TYPE_ADDRESS;
  }

  static set(
    name: string,
    decimals: i32,
    address: Address,
    isStable: bool = true
  ): TokenInfo {
    const instance = new TokenInfo();
    instance._name = name;
    instance._decimals = decimals;
    instance._address = address;
    instance._isStable = isStable;

    return instance;
  }

  get name(): string {
    return this._name;
  }
  get decimals(): i32 {
    return this._decimals;
  }
  get address(): Address {
    return this._address;
  }
  get isStable(): bool {
    return this._isStable;
  }
}

export class ContractInfo {
  private _address: Address;
  private _startBlock: BigInt;

  constructor() {
    this._address = constants.NULL.TYPE_ADDRESS;
    this._startBlock = constants.BIGINT_ZERO;
  }

  static set(address: Address, startBlock: BigInt): ContractInfo {
    const instance = new ContractInfo();
    instance._address = address;
    instance._startBlock = startBlock;

    return instance;
  }

  get address(): Address {
    return this._address;
  }
  get startBlock(): BigInt {
    return this._startBlock;
  }
}

export class CustomPriceType {
  // `null` indicates a reverted call.
  private _usdPrice: Wrapped<BigDecimal>;
  private _decimals: Wrapped<i32>;
  private _oracleType: string;

  constructor() {
    this._usdPrice = new Wrapped(constants.BIGDECIMAL_ZERO);
    this._decimals = new Wrapped(constants.BIGINT_ZERO.toI32() as u8);
    this._oracleType = "";
  }

  static initialize(
    _usdPrice: BigDecimal,
    _decimals: i32 = 0,
    _oracleType: string = ""
  ): CustomPriceType {
    const instance = new CustomPriceType();
    instance._usdPrice = new Wrapped(_usdPrice);
    instance._decimals = new Wrapped(_decimals as u8);
    instance._oracleType = _oracleType;

    return instance;
  }

  static initializePegged(
    _usdPrice: BigDecimal = constants.BIGDECIMAL_USD_PRICE,
    _decimals: i32 = constants.DEFAULT_USDC_DECIMALS,
    _oracleType: string = "HardcodedStable"
  ): CustomPriceType {
    const result = new CustomPriceType();
    result._usdPrice = new Wrapped(_usdPrice);
    result._decimals = new Wrapped(_decimals as u8);
    result._oracleType = _oracleType;

    return result;
  }

  get reverted(): bool {
    return this._usdPrice.inner == constants.BIGDECIMAL_ZERO;
  }
  get usdPrice(): BigDecimal {
    return changetype<Wrapped<BigDecimal>>(this._usdPrice).inner.div(
      constants.BIGINT_TEN.pow(this.decimals as u8).toBigDecimal()
    );
  }
  get decimals(): i32 {
    return changetype<Wrapped<i32>>(this._decimals).inner;
  }
  get oracleType(): string {
    return this._oracleType;
  }
}

export interface Configurations {
  yearnLens(): ContractInfo | null;
  yearnLensBlacklist(): Address[];

  inchOracle(): ContractInfo | null;
  inchOracleBlacklist(): Address[];

  chainLink(): ContractInfo | null;

  aaveOracle(): ContractInfo | null;
  aaveOracleBlacklist(): Address[];

  curveCalculations(): ContractInfo | null;
  curveCalculationsBlacklist(): Address[];

  sushiCalculations(): ContractInfo | null;
  sushiCalculationsBlacklist(): Address[];

  uniswapForks(): ContractInfo[];
  curveRegistry(): ContractInfo[];

  hardcodedStables(): Address[];

  whitelistedTokens(): TypedMap<string, TokenInfo>;
}
