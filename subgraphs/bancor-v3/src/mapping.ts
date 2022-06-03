import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  PoolCollectionAdded,
  PoolCreated,
  TokensTraded,
} from "../generated/BancorNetwork/BancorNetwork";
import { PoolCreated as PoolCreated__Legacy } from "../generated/PoolCollection1/PoolCollection1";
import {
  TokensDeposited,
  TokensWithdrawn,
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
} from "../generated/schema";
import {
  BancorNetworkAddr,
  BnBntAddr,
  BntAddr,
  EthAddr,
  Network,
  ProtocolType,
  zeroBD,
  zeroBI,
} from "./constants";

export function handlePoolCreatedLegacy(event: PoolCreated__Legacy): void {
  // PoolCreated__Legacy is emitted only on early blocks where we should create BNT token
  // since there's no Create Pool op on BNT
  createBntToken();
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
    poolToken,
    reserveToken,
    event.params.provider,
    event.params.tokenAmount,
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
    bnBntToken,
    bntToken,
    event.params.provider,
    event.params.bntAmount,
    event.params.poolTokenAmount
  );
}

export function handleTokensWithdrawn(event: TokensWithdrawn): void {}

export function handleBNTWithdrawn(event: BNTWithdrawn): void {}

function createBntToken(): void {
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

  // TODO: liquidity pool?
}

function _handlePoolCreated(
  pool: Address,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): void {
  let protocol = getOrCreateProtocol();

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

  // liquidity pool
  let liquidityPool = new LiquidityPool(poolTokenAddr);
  liquidityPool.protocol = protocol.id;
  liquidityPool.name = poolToken.name;
  liquidityPool.symbol = poolToken.symbol;
  liquidityPool.inputTokens = [poolToken.id];
  liquidityPool.outputToken = reserveToken.id;
  liquidityPool.rewardTokens = []; // TODO
  liquidityPool.fees = []; // TODO
  liquidityPool.createdTimestamp = blockTimestamp;
  liquidityPool.createdBlockNumber = blockNumber;
  liquidityPool.totalValueLockedUSD = zeroBD;
  liquidityPool.cumulativeVolumeUSD = zeroBD;
  liquidityPool.inputTokenBalances = []; // TODO
  liquidityPool.inputTokenWeights = []; // TODO
  liquidityPool.outputTokenSupply = zeroBI;
  liquidityPool.outputTokenPriceUSD = zeroBD;
  liquidityPool.stakedOutputTokenAmount = zeroBI;
  liquidityPool.rewardTokenEmissionsAmount = []; // TODO
  liquidityPool.rewardTokenEmissionsUSD = []; // TODO

  liquidityPool.save();
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

function _handleTokensDeposited(
  event: ethereum.Event,
  poolToken: Token,
  reserveToken: Token,
  depositer: Address,
  amountIn: BigInt,
  amountOut: BigInt
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
  deposit.inputTokenAmounts = [amountIn];
  deposit.outputToken = poolToken.id;
  deposit.outputTokenAmount = amountOut;
  deposit.amountUSD = zeroBD; // TODO
  deposit.pool = poolToken.id;

  deposit.save();
}
