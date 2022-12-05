import {
  Bytes,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  BridgeTransfer,
  CrosschainToken,
  LiquidityDeposit,
  LiquidityWithdraw,
  Pool as PoolSchema,
  PoolRoute,
  Token,
} from "../../../../generated/schema";
import { Bridge } from "./protocol";
import {
  BridgePoolType,
  CrosschainTokenType,
  TransactionType,
} from "./constants";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_MINUS_ONE,
  BIGINT_ZERO,
  BIGINT_THOUSAND,
} from "../../util/constants";
import { exponentToBigDecimal } from "../../util/numbers";

export class PoolManager {
  protocol: Bridge;

  constructor(protocol: Bridge) {
    this.protocol = protocol;
  }

  loadPool(
    id: Bytes,
    onCreate: ((event: ethereum.Event, pool: Pool) => void) | null = null
  ): Pool {
    let entity = PoolSchema.load(id);
    if (entity) {
      return new Pool(this.protocol, entity);
    }

    entity = new PoolSchema(id);
    entity.protocol = this.protocol.getBytesID();

    const pool = new Pool(this.protocol, entity);
    if (onCreate) {
      onCreate(this.protocol.getCurrentEvent(), pool);
    }
    return pool;
  }
}

export class Pool {
  pool: PoolSchema;
  protocol: Bridge;

  constructor(protocol: Bridge, pool: PoolSchema) {
    this.pool = pool;
    this.protocol = protocol;
  }

  private updateSnapshots(): void {
    // todo
  }

  private save(): void {
    this.updateSnapshots();
    this.pool.save();
  }

  private getInputToken(): Token {
    return Token.load(this.pool.inputToken)!;
  }

  initialize(
    name: string,
    symbol: string,
    type: BridgePoolType,
    inputToken: Token
  ): void {
    const event = this.protocol.getCurrentEvent();
    this.pool.name = name;
    this.pool.symbol = symbol;
    this.pool.type = type;
    this.pool.inputToken = inputToken.id;
    this.pool.destinationTokens = [];
    this.pool.routes = [];
    this.pool.createdTimestamp = event.block.timestamp;
    this.pool.createdBlockNumber = event.block.number;

    if (type == BridgePoolType.BURN_MINT) {
      this.pool.mintSupply = BIGINT_ZERO;
    }
    this.pool.inputTokenBalance = BIGINT_ZERO;
    this.pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeVolumeIn = BIGINT_ZERO;
    this.pool.cumulativeVolumeOut = BIGINT_ZERO;
    this.pool.netVolume = BIGINT_ZERO;
    this.pool.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    this.pool.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    this.pool.netVolumeUSD = BIGDECIMAL_ZERO;
    this.save();

    this.protocol.addPool();
  }

  private addRouteAndCrossToken(
    route: PoolRoute,
    token: CrosschainToken
  ): void {
    const routes = this.pool.routes;
    const tokens = this.pool.destinationTokens;

    routes.push(route.id);
    tokens.push(route.crossToken);

    this.pool.routes = routes;
    this.pool.destinationTokens = tokens;
    this.save();

    if (token.type == CrosschainTokenType.CANONICAL) {
      this.protocol.addCanonicalPoolRoute();
    } else {
      this.protocol.addWrappedPoolRoute();
    }
  }

  private routeIDFromCrosschainToken(token: CrosschainToken): Bytes {
    const chainIDs = [this.protocol.getCurrentChainID(), token.chainID].sort();
    return Bytes.fromUTF8(
      `${this.pool.id.toHexString()}-${token.id.toHexString()}-${chainIDs[0]}-${
        chainIDs[1]
      }`
    );
  }

  addDestinationToken(token: CrosschainToken): void {
    let route = this.getDestinationTokenRoute(token);
    if (route) {
      return;
    }

    const event = this.protocol.getCurrentEvent();
    const id = this.routeIDFromCrosschainToken(token);
    route = new PoolRoute(id);
    route.pool = this.pool.id;
    route.counterType = inferCounterType(this.pool.type);
    route.inputToken = this.pool.inputToken;
    route.crossToken = token.id;
    route.isSwap = this.pool.inputToken != token.token;
    route.cumulativeVolumeIn = BIGINT_ZERO;
    route.cumulativeVolumeOut = BIGINT_ZERO;
    route.cumulativeVolumeInUSD = BIGDECIMAL_ZERO;
    route.cumulativeVolumeOutUSD = BIGDECIMAL_ZERO;
    route.createdTimestamp = event.block.timestamp;
    route.createdBlockNumber = event.block.number;
    route.save();
    this.addRouteAndCrossToken(route, token);
  }

  getDestinationTokenRoute(token: CrosschainToken): PoolRoute | null {
    const id = this.routeIDFromCrosschainToken(token);
    return PoolRoute.load(id);
  }

  refreshTotalValueLocked(): void {
    const tvl = this.getInputTokenAmountPrice(this.pool.inputTokenBalance);
    this.setTotalValueLocked(tvl);
  }

  setTotalValueLocked(newTVL: BigDecimal): void {
    const delta = newTVL.minus(this.pool.totalValueLockedUSD);
    this.addTotalValueLocked(delta);
    this.save();
  }

  addTotalValueLocked(delta: BigDecimal): void {
    this.pool.totalValueLockedUSD = this.pool.totalValueLockedUSD.plus(delta);
    this.protocol.addTotalValueLocked(delta);
    this.save();
  }

  getInputTokenAmountPrice(amount: BigInt): BigDecimal {
    const token = this.getInputToken();
    const price = this.protocol.getTokenPricer().getTokenPrice(token);
    token.lastPriceUSD = price;
    token.save();

    return amount.divDecimal(exponentToBigDecimal(token.decimals)).times(price);
  }

  addInputTokenBalance(amount: BigInt): void {
    const newBalance = this.pool.inputTokenBalance.plus(amount);
    this.setInputTokenBalance(newBalance);
  }

  setInputTokenBalance(newBalance: BigInt): void {
    this.pool.inputTokenBalance = newBalance;
    this.refreshTotalValueLocked();
  }

  getBytesID(): Bytes {
    return Bytes.empty();
  }

  addVolume(
    isOutgoing: boolean,
    route: PoolRoute,
    amount: BigInt,
    amountUSD: BigDecimal
  ): void {
    if (isOutgoing) {
      route.cumulativeVolumeOut = route.cumulativeVolumeOut.plus(amount);
      route.cumulativeVolumeOutUSD =
        route.cumulativeVolumeOutUSD.plus(amountUSD);
      this.pool.cumulativeVolumeOut =
        this.pool.cumulativeVolumeOut.plus(amount);
      this.pool.cumulativeVolumeOutUSD =
        this.pool.cumulativeVolumeOutUSD.plus(amountUSD);
      this.pool.netVolume = this.pool.netVolume.minus(amount);
      this.pool.netVolumeUSD = this.pool.netVolumeUSD.minus(amountUSD);
      this.protocol.addVolumeInUSD(amountUSD);
    } else {
      route.cumulativeVolumeIn = route.cumulativeVolumeIn.plus(amount);
      route.cumulativeVolumeInUSD = route.cumulativeVolumeInUSD.plus(amountUSD);
      this.pool.cumulativeVolumeIn = this.pool.cumulativeVolumeIn.plus(amount);
      this.pool.cumulativeVolumeInUSD =
        this.pool.cumulativeVolumeInUSD.plus(amountUSD);
      this.pool.netVolume = this.pool.netVolume.plus(amount);
      this.pool.netVolumeUSD = this.pool.netVolumeUSD.plus(amountUSD);
      this.protocol.addVolumeOutUSD(amountUSD);
    }
    route.save();
    this.save();
  }

  addMintSupply(amount: BigInt): void {
    this.pool.mintSupply = this.pool.mintSupply!.plus(amount);
    this.save();
  }

  trackTransfer(
    transfer: BridgeTransfer,
    route: PoolRoute,
    eventType: TransactionType
  ): void {
    this.addVolume(
      transfer.isOutgoing,
      route,
      transfer.amount,
      transfer.amountUSD
    );
    this.protocol.addTransaction(eventType);

    if (this.pool.type == BridgePoolType.BURN_MINT) {
      let amount = transfer.amount;
      if (transfer.isOutgoing) {
        amount = amount.times(BIGINT_MINUS_ONE);
      }
      this.addMintSupply(amount);
    } else if (
      this.pool.type == BridgePoolType.LIQUIDITY ||
      this.pool.type == BridgePoolType.LOCK_RELEASE
    ) {
      let amount = transfer.amount;
      if (!transfer.isOutgoing) {
        amount = amount.times(BIGINT_MINUS_ONE);
      }
      this.addInputTokenBalance(amount);
    }
  }

  trackDeposit(deposit: LiquidityDeposit): void {
    // todo
  }

  trackWithdraw(withdraw: LiquidityWithdraw): void {
    // todo
  }
}

function inferCounterType(poolType: BridgePoolType): BridgePoolType {
  if (poolType == BridgePoolType.BURN_MINT) {
    return BridgePoolType.LOCK_RELEASE;
  }
  if (poolType == BridgePoolType.LOCK_RELEASE) {
    return BridgePoolType.BURN_MINT;
  }
  if (poolType == BridgePoolType.LIQUIDITY) {
    return BridgePoolType.LIQUIDITY;
  }

  log.error("Unknown pool type at inferCounterType {}", [poolType]);
  log.critical("", []);
  return poolType;
}
