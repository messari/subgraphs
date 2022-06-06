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
  TotalLiquidityUpdated,
} from "../generated/templates/PoolCollection2/PoolCollection2";
import { PoolCollection2 } from "../generated/templates";
import {
  TokensDeposited as BNTDeposited,
  TokensWithdrawn as BNTWithdrawn,
  TotalLiquidityUpdated as BNTTotalLiquidityUpdated,
} from "../generated/BNTPool/BNTPool";
import { PoolToken } from "../generated/BancorNetwork/PoolToken";
import { BancorNetworkInfo } from "../generated/templates/PoolCollection2/BancorNetworkInfo";
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
  BancorNetworkInfoAddr,
  BnBntAddr,
  BntAddr,
  DaiAddr,
  EthAddr,
  exponentToBigDecimal,
  Network,
  ProtocolType,
  zeroBD,
  zeroBI,
} from "./constants";

// TODO: get ETH-bnETH rate https://docs.bancor.network/developer-guides/read-functions/pool-token-information/underlyingtopooltoken

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
  swap.amountInUSD = getDaiAmount(sourceToken.id, event.params.sourceAmount);
  swap.tokenOut = targetTokenID;
  swap.amountOut = event.params.targetAmount;
  swap.amountOutUSD = zeroBD; // TODO
  swap.pool = sourceTokenID; // TODO: maybe 2 pools involved, but the field only allows one

  swap.save();

  // TODO: swap a to b should increase cumulativeVolumeUSD of a - but should i decrease from b's?
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

export function handleTotalLiquidityUpdated(
  event: TotalLiquidityUpdated
): void {
  let tokenAddress = event.params.pool.toHexString();
  let token = Token.load(tokenAddress);
  if (!token) {
    log.warning("[handleTotalLiquidityUpdated] token {} not found", [
      tokenAddress,
    ]);
    return;
  }
  if (!token._poolToken) {
    log.warning(
      "[handleTotalLiquidityUpdated] token {} doesn't link to a pool token",
      [tokenAddress]
    );
    return;
  }
  let liquidityPool = LiquidityPool.load(token._poolToken!);
  if (!liquidityPool) {
    log.warning("[handleTotalLiquidityUpdated] liquidity pool {} not found", [
      token._poolToken!,
    ]);
    return;
  }

  _handleTotalLiquidityUpdated(
    token,
    liquidityPool,
    event.params.stakedBalance,
    event.params.poolTokenSupply
  );
}

export function handleBNTTotalLiquidityUpdated(
  event: BNTTotalLiquidityUpdated
): void {
  let bntToken = Token.load(BntAddr);
  if (!bntToken) {
    log.warning("[handleBNTTotalLiquidityUpdated] BNT token {} not found", [
      BntAddr,
    ]);
    return;
  }
  let bnBntLiquidityPool = LiquidityPool.load(BnBntAddr);
  if (!bnBntLiquidityPool) {
    log.warning(
      "[handleBNTTotalLiquidityUpdated] bnBNT liquidity pool {} not found",
      [BnBntAddr]
    );
    return;
  }

  _handleTotalLiquidityUpdated(
    bntToken,
    bnBntLiquidityPool,
    event.params.stakedBalance,
    event.params.poolTokenSupply
  );
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
  liquidityPool.rewardTokens = []; // reward is not yet live
  liquidityPool.fees = []; // TODO
  liquidityPool.createdTimestamp = blockTimestamp;
  liquidityPool.createdBlockNumber = blockNumber;
  liquidityPool.totalValueLockedUSD = zeroBD;
  liquidityPool.cumulativeVolumeUSD = zeroBD;
  liquidityPool.inputTokenBalances = [zeroBI];
  liquidityPool.inputTokenWeights = [new BigDecimal(BigInt.fromI32(1))];
  liquidityPool.outputTokenSupply = zeroBI;
  liquidityPool.outputTokenPriceUSD = zeroBD;
  liquidityPool.stakedOutputTokenAmount = zeroBI;
  liquidityPool.rewardTokenEmissionsAmount = []; // reward is not yet live
  liquidityPool.rewardTokenEmissionsUSD = []; // reward is not yet live

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
  deposit.amountUSD = getDaiAmount(reserveToken.id, reserveTokenAmount);
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
  withdraw.amountUSD = getDaiAmount(reserveToken.id, reserveTokenAmount);
  withdraw.pool = poolToken.id;

  withdraw.save();
}

function _handleTotalLiquidityUpdated(
  reserveToken: Token,
  liquidityPool: LiquidityPool,
  stakedBalance: BigInt,
  poolTokenSupply: BigInt
): void {
  liquidityPool.inputTokenBalances = [stakedBalance];
  liquidityPool.totalValueLockedUSD = getDaiAmount(
    reserveToken.id,
    stakedBalance
  );
  liquidityPool.outputTokenSupply = poolTokenSupply;
  liquidityPool.save();
}

// TODO: figure out why it gets reverted sometimes
function getDaiAmount(sourceTokenID: string, sourceAmount: BigInt): BigDecimal {
  if (sourceTokenID == DaiAddr) {
    return sourceAmount.toBigDecimal().div(exponentToBigDecimal(18));
  }
  let info = BancorNetworkInfo.bind(Address.fromString(BancorNetworkInfoAddr));
  let targetAmountResult = info.try_tradeOutputBySourceAmount(
    Address.fromString(sourceTokenID),
    Address.fromString(DaiAddr),
    sourceAmount
  );
  if (targetAmountResult.reverted) {
    log.warning(
      "[getDaiAmount] try_tradeOutputBySourceAmount({}, {}, {}) reverted",
      [sourceTokenID, DaiAddr, sourceAmount.toString()]
    );
    return zeroBD;
  }
  // dai.decimals = 18
  return targetAmountResult.value.toBigDecimal().div(exponentToBigDecimal(18));
}
