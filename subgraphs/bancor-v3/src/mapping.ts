import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  PoolCollectionAdded,
  TokensTraded,
} from "../generated/BancorNetwork/BancorNetwork";
import {
  NetworkFeePPMUpdated,
  WithdrawalFeePPMUpdated,
} from "../generated/NetworkSettings/NetworkSettings";
import { ProgramCreated } from "../generated/StandardRewards/StandardRewards";
import { PoolTokenCreated } from "../generated/PoolTokenFactory/PoolTokenFactory";
import {
  TokensDeposited,
  TokensWithdrawn,
  TotalLiquidityUpdated,
} from "../generated/templates/PoolCollection/PoolCollection";
import { PoolCollection } from "../generated/templates";
import {
  TokensDeposited as BNTDeposited,
  TokensWithdrawn as BNTWithdrawn,
  TotalLiquidityUpdated as BNTTotalLiquidityUpdated,
} from "../generated/BNTPool/BNTPool";
import { PoolToken } from "../generated/BancorNetwork/PoolToken";
import { BancorNetworkInfo } from "../generated/BancorNetwork/BancorNetworkInfo";
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
  secondsPerDay,
  zeroBD,
  zeroBI,
} from "./constants";

enum EventType {
  Swap,
  Withdraw,
}

export function handlePoolTokenCreated(event: PoolTokenCreated): void {
  let poolTokenAddress = event.params.poolToken;
  let reserveTokenAddress = event.params.token;

  let poolTokenID = poolTokenAddress.toHexString();
  let poolToken = Token.load(poolTokenID);
  if (poolToken != null) {
    log.warning("[handlePoolTokenCreated] pool token {} already exists", [
      poolTokenID,
    ]);
    return;
  }

  // pool token
  poolToken = new Token(poolTokenID);
  let poolTokenContract = PoolToken.bind(poolTokenAddress);

  let poolTokenNameResult = poolTokenContract.try_name();
  if (poolTokenNameResult.reverted) {
    log.warning("[handlePoolTokenCreated] try_name on {} reverted", [
      poolTokenID,
    ]);
    poolToken.name = "unknown name";
  } else {
    poolToken.name = poolTokenNameResult.value;
  }

  let poolTokenSymbolResult = poolTokenContract.try_symbol();
  if (poolTokenSymbolResult.reverted) {
    log.warning("[handlePoolTokenCreated] try_symbol on {} reverted", [
      poolTokenID,
    ]);
    poolToken.symbol = "unknown symbol";
  } else {
    poolToken.symbol = poolTokenSymbolResult.value;
  }

  let poolTokenDecimalsResult = poolTokenContract.try_decimals();
  if (poolTokenDecimalsResult.reverted) {
    log.warning("[handlePoolTokenCreated] try_decimals on {} reverted", [
      poolTokenID,
    ]);
    poolToken.decimals = 0;
  } else {
    poolToken.decimals = poolTokenDecimalsResult.value;
  }

  poolToken.save();

  // reserve token
  let reserveTokenID = reserveTokenAddress.toHexString();
  let reserveToken = new Token(reserveTokenID);
  reserveToken._poolToken = poolTokenID;

  if (reserveTokenAddress == Address.fromString(EthAddr)) {
    reserveToken.name = "Ether";
    reserveToken.symbol = "ETH";
    reserveToken.decimals = 18;
  } else {
    let tokenContract = ERC20.bind(Address.fromString(reserveTokenID));

    let tokenNameResult = tokenContract.try_name();
    if (tokenNameResult.reverted) {
      log.warning("[handlePoolTokenCreated] try_name on {} reverted", [
        reserveTokenID,
      ]);
      reserveToken.name = "unknown name";
    } else {
      reserveToken.name = tokenNameResult.value;
    }

    let tokenSymbolResult = tokenContract.try_symbol();
    if (tokenSymbolResult.reverted) {
      log.warning("[handlePoolTokenCreated] try_symbol on {} reverted", [
        reserveTokenID,
      ]);
      reserveToken.symbol = "unknown symbol";
    } else {
      reserveToken.symbol = tokenSymbolResult.value;
    }

    let tokenDecimalsResult = tokenContract.try_decimals();
    if (tokenDecimalsResult.reverted) {
      log.warning("[handlePoolTokenCreated] try_decimals on {} reverted", [
        reserveTokenID,
      ]);
      reserveToken.decimals = 0;
    } else {
      reserveToken.decimals = tokenDecimalsResult.value;
    }
  }
  reserveToken.save();

  createLiquidityPool(
    reserveToken,
    poolToken,
    event.block.timestamp,
    event.block.number
  );
}

export function handlePoolCollectionAdded(event: PoolCollectionAdded): void {
  PoolCollection.create(event.params.poolCollection);
}

// TODO: TradingFeePPMUpdated?

export function handleNetworkFeePPMUpdated(event: NetworkFeePPMUpdated): void {
  let protocol = getOrCreateProtocol();
  protocol._networkFeeRate = event.params.newFeePPM
    .toBigDecimal()
    .div(exponentToBigDecimal(6));
  protocol.save();
}

export function handleWithdrawalFeePPMUpdated(
  event: WithdrawalFeePPMUpdated
): void {
  let protocol = getOrCreateProtocol();
  protocol._withdrawalFeeRate = event.params.newFeePPM
    .toBigDecimal()
    .div(exponentToBigDecimal(6));
  protocol.save();
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
  let amountInUSD = getDaiAmount(sourceToken.id, event.params.sourceAmount);
  swap.amountInUSD = amountInUSD;
  swap.tokenOut = targetTokenID;
  swap.amountOut = event.params.targetAmount;
  swap.amountOutUSD = getDaiAmount(targetToken.id, event.params.targetAmount);
  swap.pool = sourceTokenID; // TODO: maybe 2 pools involved, but the field only allows one
  swap._tradingFeeAmount = event.params.targetFeeAmount;
  let tradingFeeAmountUSD = getDaiAmount(
    targetToken.id,
    event.params.targetFeeAmount
  );
  swap._tradingFeeAmountUSD = tradingFeeAmountUSD;

  swap.save();

  if (!sourceToken._poolToken) {
    log.warning("[handleTokensTraded] reserve token {} has no pool token", [
      sourceToken.id,
    ]);
    return;
  }
  let liquidityPool = LiquidityPool.load(sourceToken._poolToken!);
  if (!liquidityPool) {
    log.warning("[handleTokensTraded] liquidity pool {} not found", [
      sourceToken._poolToken!,
    ]);
    return;
  }
  liquidityPool.cumulativeVolumeUSD =
    liquidityPool.cumulativeVolumeUSD.plus(amountInUSD);
  liquidityPool._cumulativeTradingFeeAmountUSD =
    liquidityPool._cumulativeTradingFeeAmountUSD.plus(tradingFeeAmountUSD);
  liquidityPool.save();

  updateProtocolLevelFee(EventType.Swap, tradingFeeAmountUSD);
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

  if (!reserveToken._poolToken) {
    log.warning("[handleTokensDeposited] reserve token {} has no pool token", [
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
    event.params.poolTokenAmount,
    event.params.withdrawalFeeAmount
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
    event.params.poolTokenAmount,
    event.params.withdrawalFeeAmount
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
    log.warning("[handleTotalLiquidityUpdated] token {} has no pool token", [
      tokenAddress,
    ]);
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

// currently each pool only has 1 reward program
// TODO: change this if it is no longer the case
// TODO: also handle ProgramTerminated and ProgramEnabled
export function handleProgramCreated(event: ProgramCreated): void {
  let reserveTokenId = event.params.pool.toHexString();
  let reserveToken = Token.load(reserveTokenId);
  if (!reserveToken) {
    log.warning("[handleProgramCreated] reserve token {} not found", [
      reserveTokenId,
    ]);
    return;
  }
  if (!reserveToken._poolToken) {
    log.warning("[handleProgramCreated] reserve token {} has no pool token", [
      reserveTokenId,
    ]);
    return;
  }

  let liquidityPool = LiquidityPool.load(reserveToken._poolToken!);
  if (!liquidityPool) {
    log.warning("[handleProgramCreated] liquidity pool {} not found", [
      reserveToken._poolToken!,
    ]);
    return;
  }

  // TODO: liquidityPool.rewardTokens = ???
  // TODO: each reward program has a start and end time
  let rewardRate = event.params.totalRewards.div(
    event.params.endTime.minus(event.params.startTime)
  );
  let rewardAmountInDay = rewardRate.times(BigInt.fromI32(secondsPerDay));
  let rewardAmountUSD = getDaiAmount(
    event.params.rewardsToken.toHexString(),
    rewardAmountInDay
  );
  liquidityPool.rewardTokenEmissionsAmount = [rewardAmountInDay];
  liquidityPool.rewardTokenEmissionsUSD = [rewardAmountUSD];
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
    protocol._networkFeeRate = zeroBD;
    protocol._withdrawalFeeRate = zeroBD;
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
  liquidityPool.rewardTokens = [];
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
  liquidityPool.rewardTokenEmissionsAmount = [];
  liquidityPool.rewardTokenEmissionsUSD = [];
  liquidityPool._cumulativeTradingFeeAmountUSD = zeroBD;
  liquidityPool._cumulativeWithdrawalFeeAmountUSD = zeroBD;

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
  poolTokenAmount: BigInt,
  withdrawalFeeAmount: BigInt
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
  withdraw._withdrawalFeeAmount = withdrawalFeeAmount;
  let withdrawalFeeAmountUSD = getDaiAmount(
    reserveToken.id,
    withdrawalFeeAmount
  );
  withdraw._withdrawalFeeAmountUSD = withdrawalFeeAmountUSD;

  withdraw.save();

  let liquidityPool = LiquidityPool.load(poolToken.id);
  if (!liquidityPool) {
    log.warning("[handleTokensWithdrawn] liquidity pool {} not found", [
      poolToken.id,
    ]);
    return;
  }
  liquidityPool._cumulativeWithdrawalFeeAmountUSD =
    liquidityPool._cumulativeWithdrawalFeeAmountUSD.plus(
      withdrawalFeeAmountUSD
    );

  liquidityPool.save();

  updateProtocolLevelFee(EventType.Withdraw, withdrawalFeeAmountUSD);
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
  liquidityPool.outputTokenPriceUSD = getDaiAmount(
    reserveToken.id,
    getReserveTokenAmount(reserveToken.id, poolTokenSupply)
  );
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
  log.warning("[getDaiAmount] try_tradeOutputBySourceAmount({}, {}, {}) ok", [
    sourceTokenID,
    DaiAddr,
    sourceAmount.toString(),
  ]);
  // dai.decimals = 18
  return targetAmountResult.value.toBigDecimal().div(exponentToBigDecimal(18));
}

// TODO: figure out why it 100% reverts
function getReserveTokenAmount(
  reserveTokenID: string,
  poolTokenAmount: BigInt
): BigInt {
  let info = BancorNetworkInfo.bind(Address.fromString(BancorNetworkInfoAddr));
  let reserveTokenAmountResult = info.try_poolTokenToUnderlying(
    Address.fromString(reserveTokenID),
    poolTokenAmount
  );
  if (!reserveTokenAmountResult.reverted) {
    log.warning(
      "[getReserveTokenAmount] try_poolTokenToUnderlying({}, {}) reverted",
      [reserveTokenID, poolTokenAmount.toString()]
    );
    return zeroBI;
  }
  log.warning("[getReserveTokenAmount] try_poolTokenToUnderlying({}, {}) ok", [
    reserveTokenID,
    poolTokenAmount.toString(),
  ]);
  return reserveTokenAmountResult.value;
}

function updateProtocolLevelFee(
  eventType: EventType,
  amountUSD: BigDecimal
): void {
  let protocol = getOrCreateProtocol();
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(amountUSD);
  switch (eventType) {
    case EventType.Swap:
      let protocolSideRevenue = amountUSD.times(protocol._networkFeeRate);
      let supplySideRevenue = amountUSD.minus(protocolSideRevenue);
      protocol.cumulativeSupplySideRevenueUSD =
        protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenue);
      protocol.cumulativeProtocolSideRevenueUSD =
        protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenue);
      break;
    case EventType.Withdraw:
      protocol.cumulativeProtocolSideRevenueUSD =
        protocol.cumulativeProtocolSideRevenueUSD.plus(amountUSD);
      break;
    default:
  }
  protocol.save();
}
