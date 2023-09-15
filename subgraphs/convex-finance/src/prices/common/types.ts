import * as constants from "./constants";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export class Wrapped<T> {
  inner: T;

  constructor(inner: T) {
    this.inner = inner;
  }
}

export class OracleContract {
  private _contractAddress: string;
  private _contractStartBlock: i32;

  constructor(
    contractAddress: string = constants.NULL.TYPE_STRING,
    startBlock: i32 = -1
  ) {
    this._contractAddress = contractAddress;
    this._contractStartBlock = startBlock;
  }

  get address(): Address {
    return Address.fromString(this._contractAddress);
  }

  get startBlock(): BigInt {
    return BigInt.fromI32(this._contractStartBlock);
  }
}

export class CustomPriceType {
  // `null` indicates a reverted call.
  private _usdPrice: Wrapped<BigDecimal>;
  private _decimals: Wrapped<i32>;
  private _oracleType: string;
  private _liquidity: Wrapped<BigDecimal>;

  constructor() {
    this._usdPrice = new Wrapped(constants.BIGDECIMAL_ZERO);
    this._decimals = new Wrapped(constants.BIGINT_ZERO.toI32() as u8);
    this._oracleType = "";
    this._liquidity = new Wrapped(constants.BIGDECIMAL_ZERO);
  }

  static initialize(
    _usdPrice: BigDecimal,
    _decimals: i32 = 0,
    _oracleType: string = "",
    _liquidity: BigDecimal | null = null
  ): CustomPriceType {
    const result = new CustomPriceType();
    result._usdPrice = new Wrapped(_usdPrice);
    result._decimals = new Wrapped(_decimals as u8);
    result._oracleType = _oracleType;
    if (_liquidity) result._liquidity = new Wrapped(_liquidity);

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

  get liquidity(): BigDecimal {
    return this._liquidity.inner;
  }

  setLiquidity(liquidity: BigDecimal): void {
    this._liquidity = new Wrapped(liquidity);
  }
}

export interface OracleConfig {
  oracleCount(): number;
  oracleOrder(): string[];
}

export class OracleType {
  oracleCount: number;
  oracleOrder: string[];

  constructor() {
    this.oracleCount = constants.INT_ONE;
    this.oracleOrder = [
      constants.OracleType.YEARN_LENS_ORACLE,
      constants.OracleType.CHAINLINK_FEED,
      constants.OracleType.CURVE_CALCULATIONS,
      constants.OracleType.SUSHI_CALCULATIONS,
      constants.OracleType.CURVE_ROUTER,
      constants.OracleType.UNISWAP_FORKS_ROUTER,
    ];
  }

  setOracleConfig(override: OracleConfig): void {
    this.oracleCount = override.oracleCount();
    this.oracleOrder = override.oracleOrder();
  }
}

export interface Configurations {
  network(): string;

  yearnLens(): OracleContract;
  chainLink(): OracleContract;
  yearnLensBlacklist(): Address[];

  aaveOracle(): OracleContract;
  aaveOracleBlacklist(): Address[];

  curveCalculations(): OracleContract;
  curveCalculationsBlacklist(): Address[];

  sushiCalculations(): OracleContract;
  sushiCalculationsBlacklist(): Address[];

  uniswapForks(): OracleContract[];
  curveRegistry(): OracleContract[];

  hardcodedStables(): Address[];

  ethAddress(): Address;
  wethAddress(): Address;
  usdcAddress(): Address;

  usdcTokenDecimals(): BigInt;

  getOracleOverride(
    tokenAddr: Address | null,
    block: ethereum.Block | null
  ): OracleConfig | null;
}
