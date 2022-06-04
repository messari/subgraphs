import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  PoolCollectionAdded,
  PoolCreated,
  TokensTraded,
} from "../generated/BancorNetwork/BancorNetwork";
import { PoolCreated as PoolCreated__Legacy } from "../generated/PoolCollection1/PoolCollection1";
import {
  TokensDeposited,
  TokensWithdrawn,
  TradingLiquidityUpdated,
} from "../generated/templates/PoolCollection2/PoolCollection2";
import { PoolCollection2 } from "../generated/templates";
import {
  TokensDeposited as BNTDeposited,
  TokensWithdrawn as BNTWithdrawn,
} from "../generated/BNTPool/BNTPool";
import { PoolToken } from "../generated/BancorNetwork/PoolToken";
import { ERC20 } from "../generated/BancorNetwork/ERC20";
import {
  Deposit,
  DexAmmProtocol,
  LiquidityPool,
  Swap,
  Token,
  Withdraw,
} from "../generated/schema";
import {
  BancorNetworkAddr,
  BnBntAddr,
  BnDaiAddr,
  BntAddr,
  DaiAddr,
  EthAddr,
  exponentToBigDecimal,
  Network,
  ProtocolType,
  zeroBD,
  zeroBI,
} from "./constants";

export function handlePoolCreatedLegacy(event: PoolCreated__Legacy): void {
  // PoolCreated__Legacy is emitted only on early blocks where we should create BNT token
  // since there's no Create Pool op on BNT
  createBntToken(event.block.timestamp, event.block.number);
  _handlePoolCreated(
    event.params.poolToken,
    event.block.timestamp,
    event.block.number
  );
}

export function handlePoolCreated(event: PoolCreated): void {
  _handlePoolCreated(
    event.params.pool,
    event.block.timestamp,
    event.block.number
  );
}

export function handlePoolCollectionAdded(event: PoolCollectionAdded): void {
  PoolCollection2.create(event.params.poolCollection);
}

export function handleTokensTraded(event: TokensTraded): void {
  let sourceTokenID = event.params.sourceToken.toHexString();
  let targetTokenID = event.params.targetToken.toHexString();
  let sourceToken = Token.load(sourceTokenID);
  if (!sourceToken) {
    log.warning("[handleTokensTraded] source token {} not found", [
      sourceTokenID,
    ]);
    return;
  }
  let targetToken = Token.load(targetTokenID);
  if (!targetToken) {
    log.warning("[handleTokensTraded] target token {} not found", [
      targetTokenID,
    ]);
    return;
  }
  let swap = new Swap(
    "swap-"
      .concat(event.transaction.hash.toHexString())
      .concat("-")
      .concat(event.logIndex.toString())
  );
  swap.hash = event.transaction.hash.toHexString();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = getOrCreateProtocol().id;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.from = event.params.trader.toHexString();
  // TODO: use pool token id
  swap.to = event.params.trader.toHexString();
  swap.tokenIn = sourceTokenID;
  swap.amountIn = event.params.sourceAmount;
  swap.amountInUSD = zeroBD; // TODO
  swap.tokenOut = targetTokenID;
  swap.amountOut = event.params.targetAmount;
  swap.amountOutUSD = zeroBD; // TODO
  swap.pool = sourceTokenID; // TODO: maybe 2 pools involved, but the field only allows one

  swap.save();
}

export function handleTokensDeposited(event: TokensDeposited): void {
  let reserveTokenID = event.params.token.toHexString();
  let reserveToken = Token.load(reserveTokenID);
  if (!reserveToken) {
    log.warning("[handleTokensDeposited] reserve token {} not found", [
      reserveTokenID,
    ]);
    return;
  }
  let poolToken = Token.load(reserveToken._poolToken!);
  if (!poolToken) {
    log.warning("[handleTokensDeposited] pool token {} not found", [
      reserveToken._poolToken!,
    ]);
    return;
  }

  _handleTokensDeposited(
    event,
    event.params.provider,
    reserveToken,
    event.params.tokenAmount,
    poolToken,
    event.params.poolTokenAmount
  );
}

export function handleBNTDeposited(event: BNTDeposited): void {
  let bntToken = Token.load(BntAddr);
  if (!bntToken) {
    log.warning("[handleBNTDeposited] BNT token {} not found", [BntAddr]);
    return;
  }
  let bnBntToken = Token.load(BnBntAddr);
  if (!bnBntToken) {
    log.warning("[handleBNTDeposited] bnBNT token {} not found", [BnBntAddr]);
    return;
  }

  _handleTokensDeposited(
    event,
    event.params.provider,
    bntToken,
    event.params.bntAmount,
    bnBntToken,
    event.params.poolTokenAmount
  );
}

export function handleTokensWithdrawn(event: TokensWithdrawn): void {
  let reserveTokenID = event.params.token.toHexString();
  let reserveToken = Token.load(reserveTokenID);
  if (!reserveToken) {
    log.warning("[handleTokensWithdrawn] reserve token {} not found", [
      reserveTokenID,
    ]);
    return;
  }
  let poolToken = Token.load(reserveToken._poolToken!);
  if (!poolToken) {
    log.warning("[handleTokensWithdrawn] pool token {} not found", [
      reserveToken._poolToken!,
    ]);
    return;
  }

  _handleTokensWithdrawn(
    event,
    event.params.provider,
    reserveToken,
    event.params.tokenAmount,
    poolToken,
    event.params.poolTokenAmount
  );
}

export function handleBNTWithdrawn(event: BNTWithdrawn): void {
  let bntToken = Token.load(BntAddr);
  if (!bntToken) {
    log.warning("[handleBNTWithdrawn] BNT token {} not found", [BntAddr]);
    return;
  }
  let bnBntToken = Token.load(BnBntAddr);
  if (!bnBntToken) {
    log.warning("[handleBNTWithdrawn] bnBNT token {} not found", [BnBntAddr]);
    return;
  }

  _handleTokensWithdrawn(
    event,
    event.params.provider,
    bntToken,
    event.params.bntAmount,
    bnBntToken,
    event.params.poolTokenAmount
  );
}

export function handleTradingLiquidityUpdated(
  event: TradingLiquidityUpdated
): void {
  let tokenAddress = event.params.token.toHexString();
  let token = Token.load(tokenAddress);
  if (!token) {
    log.warning("[handleTradingLiquidityUpdated] token {} not found", [
      tokenAddress,
    ]);
    return;
  }
  if (!token._poolToken) {
    log.warning(
      "[handleTradingLiquidityUpdated] token {} doesn't link to a pool token",
      [tokenAddress]
    );
    return;
  }
  let liquidityPool = LiquidityPool.load(token._poolToken!);
  if (!liquidityPool) {
    log.warning("[handleTradingLiquidityUpdated] liquidity pool {} not found", [
      token._poolToken!,
    ]);
    return;
  }
  liquidityPool.inputTokenBalances = [event.params.newLiquidity];
  liquidityPool.save();
}

function createBntToken(blockTimestamp: BigInt, blockNumber: BigInt): void {
  let bnBntToken = Token.load(BnBntAddr);
  if (bnBntToken) {
    return;
  }
  bnBntToken = new Token(BnBntAddr);
  bnBntToken.name = "Bancor BNT Pool Token";
  bnBntToken.symbol = "bnBNT";
  bnBntToken.decimals = 18;
  bnBntToken.save();

  let bntToken = new Token(BntAddr);
  bntToken.name = "Bancor Network Token";
  bntToken.symbol = "BNT";
  bntToken.decimals = 18;
  bntToken._poolToken = BnBntAddr;
  bntToken.save();

  createLiquidityPool(bntToken, bnBntToken, blockTimestamp, blockNumber);
}

function _handlePoolCreated(
  pool: Address,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): void {
  let poolTokenAddr = pool.toHexString();
  let poolToken = Token.load(poolTokenAddr);
  if (poolToken != null) {
    log.warning("[handlePoolCreated] pool token {} exists", [poolTokenAddr]);
    return;
  }

  // pool token
  poolToken = new Token(poolTokenAddr);
  let poolTokenContract = PoolToken.bind(pool);

  let poolTokenNameResult = poolTokenContract.try_name();
  if (poolTokenNameResult.reverted) {
    log.warning("[handlePoolCreated] try_name on {} reverted", [poolTokenAddr]);
    poolToken.name = "unknown name";
  } else {
    poolToken.name = poolTokenNameResult.value;
  }

  let poolTokenSymbolResult = poolTokenContract.try_symbol();
  if (poolTokenSymbolResult.reverted) {
    log.warning("[handlePoolCreated] try_symbol on {} reverted", [
      poolTokenAddr,
    ]);
    poolToken.symbol = "unknown symbol";
  } else {
    poolToken.symbol = poolTokenSymbolResult.value;
  }

  let poolTokenDecimalsResult = poolTokenContract.try_decimals();
  if (poolTokenDecimalsResult.reverted) {
    log.warning("[handlePoolCreated] try_decimals on {} reverted", [
      poolTokenAddr,
    ]);
    poolToken.decimals = 0;
  } else {
    poolToken.decimals = poolTokenDecimalsResult.value;
  }

  poolToken.save();

  // token
  let reserveTokenAddrResult = poolTokenContract.try_reserveToken();
  if (reserveTokenAddrResult.reverted) {
    log.warning("[handlePoolCreated] try_reserveToken on {} reverted", [
      poolTokenAddr,
    ]);
    return;
  }
  let reserveTokenAddr = reserveTokenAddrResult.value.toHexString();
  let reserveToken = new Token(reserveTokenAddr);
  reserveToken._poolToken = poolTokenAddr;

  if (reserveTokenAddrResult.value == Address.fromString(EthAddr)) {
    reserveToken.name = "Ether";
    reserveToken.symbol = "ETH";
    reserveToken.decimals = 18;
  } else {
    let tokenContract = ERC20.bind(Address.fromString(reserveTokenAddr));

    let tokenNameResult = tokenContract.try_name();
    if (tokenNameResult.reverted) {
      log.warning("[handlePoolCreated] try_name on {} reverted", [
        reserveTokenAddr,
      ]);
      reserveToken.name = "unknown name";
    } else {
      reserveToken.name = tokenNameResult.value;
    }

    let tokenSymbolResult = tokenContract.try_symbol();
    if (tokenSymbolResult.reverted) {
      log.warning("[handlePoolCreated] try_symbol on {} reverted", [
        reserveTokenAddr,
      ]);
      reserveToken.symbol = "unknown symbol";
    } else {
      reserveToken.symbol = tokenSymbolResult.value;
    }

    let tokenDecimalsResult = tokenContract.try_decimals();
    if (tokenDecimalsResult.reverted) {
      log.warning("[handlePoolCreated] try_decimals on {} reverted", [
        reserveTokenAddr,
      ]);
      reserveToken.decimals = 0;
    } else {
      reserveToken.decimals = tokenDecimalsResult.value;
    }
  }
  reserveToken.save();

  createLiquidityPool(reserveToken, poolToken, blockTimestamp, blockNumber);
}

function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(BancorNetworkAddr);
  if (!protocol) {
    protocol = new DexAmmProtocol(BancorNetworkAddr);
    protocol.name = "Bancor V3";
    protocol.slug = "bancor-v3";
    protocol.schemaVersion = "1.2.1";
    protocol.subgraphVersion = "1.0.0";
    protocol.methodologyVersion = "1.0.0";
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalValueLockedUSD = zeroBD;
    protocol.cumulativeVolumeUSD = zeroBD;
    protocol.cumulativeSupplySideRevenueUSD = zeroBD;
    protocol.cumulativeProtocolSideRevenueUSD = zeroBD;
    protocol.cumulativeTotalRevenueUSD = zeroBD;
    protocol.cumulativeUniqueUsers = 0;
    protocol.save();
  }
  return protocol;
}

function createLiquidityPool(
  reserveToken: Token,
  poolToken: Token,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): void {
  let liquidityPool = new LiquidityPool(poolToken.id);

  liquidityPool.protocol = getOrCreateProtocol().id;
  liquidityPool.name = poolToken.name;
  liquidityPool.symbol = poolToken.symbol;
  liquidityPool.inputTokens = [reserveToken.id];
  liquidityPool.outputToken = poolToken.id;
  liquidityPool.rewardTokens = []; // TODO
  liquidityPool.fees = []; // TODO
  liquidityPool.createdTimestamp = blockTimestamp;
  liquidityPool.createdBlockNumber = blockNumber;
  liquidityPool.totalValueLockedUSD = zeroBD;
  liquidityPool.cumulativeVolumeUSD = zeroBD;
  liquidityPool.inputTokenBalances = [zeroBI];
  liquidityPool.inputTokenWeights = []; // TODO
  liquidityPool.outputTokenSupply = zeroBI;
  liquidityPool.outputTokenPriceUSD = zeroBD;
  liquidityPool.stakedOutputTokenAmount = zeroBI;
  liquidityPool.rewardTokenEmissionsAmount = []; // TODO
  liquidityPool.rewardTokenEmissionsUSD = []; // TODO

  liquidityPool.save();
}

function _handleTokensDeposited(
  event: ethereum.Event,
  depositer: Address,
  reserveToken: Token,
  reserveTokenAmount: BigInt,
  poolToken: Token,
  poolTokenAmount: BigInt
): void {
  let deposit = new Deposit(
    "deposit-"
      .concat(event.transaction.hash.toHexString())
      .concat("-")
      .concat(event.logIndex.toString())
  );
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = getOrCreateProtocol().id;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.to = poolToken.id;
  deposit.from = depositer.toHexString();
  deposit.inputTokens = [reserveToken.id];
  deposit.inputTokenAmounts = [reserveTokenAmount];
  deposit.outputToken = poolToken.id;
  deposit.outputTokenAmount = poolTokenAmount;
  deposit.amountUSD = reserveTokenAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(reserveToken.decimals))
    .times(getTokenPriceUSD(Address.fromString(reserveToken.id)));
  deposit.pool = poolToken.id;

  deposit.save();
}

function _handleTokensWithdrawn(
  event: ethereum.Event,
  withdrawer: Address,
  reserveToken: Token,
  reserveTokenAmount: BigInt,
  poolToken: Token,
  poolTokenAmount: BigInt
): void {
  let withdraw = new Withdraw(
    "withdraw-"
      .concat(event.transaction.hash.toHexString())
      .concat("-")
      .concat(event.logIndex.toString())
  );
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = getOrCreateProtocol().id;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.to = withdrawer.toHexString();
  withdraw.from = poolToken.id;
  withdraw.inputTokens = [reserveToken.id];
  withdraw.inputTokenAmounts = [reserveTokenAmount];
  withdraw.outputToken = poolToken.id;
  withdraw.outputTokenAmount = poolTokenAmount;
  withdraw.amountUSD = reserveTokenAmount
    .toBigDecimal()
    .div(exponentToBigDecimal(reserveToken.decimals))
    .times(getTokenPriceUSD(Address.fromString(reserveToken.id)));
  withdraw.pool = poolToken.id;

  withdraw.save();
}

// reserve token only
function getTokenPriceUSD(tokenAddress: Address): BigDecimal {
  if (tokenAddress == Address.fromString(DaiAddr)) {
    return new BigDecimal(BigInt.fromI32(1));
  }

  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    log.warning("[getTokenPrice] token {} not found", [
      tokenAddress.toHexString(),
    ]);
    return zeroBD;
  }
  if (!token._poolToken) {
    log.warning("[getTokenPrice] token {} doesn't link to a pool token", [
      tokenAddress.toHexString(),
    ]);
    return zeroBD;
  }
  let tokenLiquidityPool = LiquidityPool.load(token._poolToken!);
  if (!tokenLiquidityPool) {
    log.warning("[getTokenPrice] token {} liquidity pool not found", [
      token._poolToken!,
    ]);
    return zeroBD;
  }

  let daiToken = Token.load(DaiAddr);
  if (!daiToken) {
    log.warning("[getTokenPrice] DAI token not found", []);
    return zeroBD;
  }

  let daiLiquidityPool = LiquidityPool.load(BnDaiAddr);
  if (!daiLiquidityPool) {
    log.warning("[getTokenPrice] DAI liquidity pool not found", [BnDaiAddr]);
    return zeroBD;
  }

  if (tokenLiquidityPool.inputTokenBalances[0] == zeroBI) {
    return zeroBD;
  }

  return daiLiquidityPool.inputTokenBalances[0]
    .toBigDecimal()
    .div(exponentToBigDecimal(daiToken.decimals))
    .div(
      tokenLiquidityPool.inputTokenBalances[0]
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
    );
}
