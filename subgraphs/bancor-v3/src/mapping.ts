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
import {
  ProgramCreated,
  ProgramEnabled,
  ProgramTerminated,
} from "../generated/StandardRewards/StandardRewards";
import { PoolTokenCreated } from "../generated/PoolTokenFactory/PoolTokenFactory";
import {
  DefaultTradingFeePPMUpdated,
  TokensDeposited,
  TokensWithdrawn,
  TotalLiquidityUpdated,
  TradingFeePPMUpdated,
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
  Account,
  ActiveAccount,
  Deposit,
  DexAmmProtocol,
  FinancialsDailySnapshot,
  LiquidityPool,
  LiquidityPoolDailySnapshot,
  LiquidityPoolFee,
  LiquidityPoolHourlySnapshot,
  RewardProgram,
  RewardToken,
  Swap,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
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
  exponentToBigInt,
  hundredBD,
  LiquidityPoolFeeType,
  Network,
  oneBD,
  ProtocolType,
  RewardTokenType,
  secondsPerDay,
  secondsPerHour,
  zeroBD,
  zeroBI,
} from "./constants";
import { Versions } from "./versions";

let withdrawFeeIdx = 0;
let tradingFeeIdx = 1;
let protocolFeeIdx = 2;
let lpFeeIdx = 3;

enum EventType {
  Swap,
  Withdraw,
  Deposit,
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

  let liquidityPool = createLiquidityPool(
    reserveToken,
    poolToken,
    event.block.timestamp,
    event.block.number
  );

  let protocol = DexAmmProtocol.load(BancorNetworkAddr);
  if (!protocol) {
    log.warning("[handlePoolTokenCreated] protocol not found", []);
    return;
  }
  let poolIDs = protocol._poolIDs;
  poolIDs.push(liquidityPool.id);
  protocol._poolIDs = poolIDs;
  protocol.totalPoolCount = poolIDs.length;
  protocol.save();
}

export function handlePoolCollectionAdded(event: PoolCollectionAdded): void {
  PoolCollection.create(event.params.poolCollection);
}

export function handleDefaultTradingFeePPMUpdated(
  event: DefaultTradingFeePPMUpdated
): void {
  let protocol = getOrCreateProtocol();
  protocol._defaultTradingFeeRate = event.params.newFeePPM
    .toBigDecimal()
    .div(exponentToBigDecimal(6));
  protocol.save();

  for (let i = 0; i < protocol._poolIDs.length; i++) {
    updateLiquidityPoolFees(protocol._poolIDs[i]);
  }
}

export function handleTradingFeePPMUpdated(event: TradingFeePPMUpdated): void {
  let reserveTokenID = event.params.pool.toHexString();
  let reserveToken = Token.load(reserveTokenID);
  if (!reserveToken) {
    log.warning("[handleTradingFeePPMUpdated] reserve token {} not found", [
      reserveTokenID,
    ]);
    return;
  }

  if (!reserveToken._poolToken) {
    log.warning(
      "[handleTradingFeePPMUpdated] reserve token {} has no pool token",
      [reserveTokenID]
    );
    return;
  }

  let liquidityPoolID = reserveToken._poolToken!;
  let liquidityPool = LiquidityPool.load(liquidityPoolID);
  if (!liquidityPool) {
    log.warning("[handleTradingFeePPMUpdated] liquidity pool {} not found", [
      liquidityPoolID,
    ]);
    return;
  }

  liquidityPool._tradingFeeRate = event.params.newFeePPM
    .toBigDecimal()
    .div(exponentToBigDecimal(6));
  liquidityPool.save();

  updateLiquidityPoolFees(liquidityPoolID);
}

export function handleNetworkFeePPMUpdated(event: NetworkFeePPMUpdated): void {
  let protocol = getOrCreateProtocol();
  protocol._networkFeeRate = event.params.newFeePPM
    .toBigDecimal()
    .div(exponentToBigDecimal(6));
  protocol.save();

  for (let i = 0; i < protocol._poolIDs.length; i++) {
    updateLiquidityPoolFees(protocol._poolIDs[i]);
  }
}

export function handleWithdrawalFeePPMUpdated(
  event: WithdrawalFeePPMUpdated
): void {
  let protocol = getOrCreateProtocol();
  protocol._withdrawalFeeRate = event.params.newFeePPM
    .toBigDecimal()
    .div(exponentToBigDecimal(6));
  protocol.save();

  for (let i = 0; i < protocol._poolIDs.length; i++) {
    updateLiquidityPoolFees(protocol._poolIDs[i]);
  }
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

  if (!sourceToken._poolToken) {
    log.warning("[handleTokensTraded] reserve token {} has no pool token", [
      sourceToken.id,
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
  swap.protocol = BancorNetworkAddr;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.from = event.params.trader.toHexString();
  swap.to = sourceToken._poolToken!;
  swap.tokenIn = sourceTokenID;
  swap.amountIn = event.params.sourceAmount;
  let amountInUSD = getDaiAmount(sourceToken.id, event.params.sourceAmount);
  swap.amountInUSD = amountInUSD;
  swap.tokenOut = targetTokenID;
  swap.amountOut = event.params.targetAmount;
  swap.amountOutUSD = getDaiAmount(targetToken.id, event.params.targetAmount);
  swap.pool = sourceToken._poolToken!;
  swap._tradingFeeAmount = event.params.targetFeeAmount;
  let tradingFeeAmountUSD = getDaiAmount(
    targetToken.id,
    event.params.targetFeeAmount
  );
  swap._tradingFeeAmountUSD = tradingFeeAmountUSD;
  swap.save();

  let liquidityPool = LiquidityPool.load(sourceToken._poolToken!);
  if (!liquidityPool) {
    log.warning("[handleTokensTraded] liquidity pool {} not found", [
      sourceToken._poolToken!,
    ]);
    return;
  }

  let protocol = getOrCreateProtocol();
  let protocolSideRevenue = tradingFeeAmountUSD.times(protocol._networkFeeRate);
  let supplySideRevenue = tradingFeeAmountUSD.minus(protocolSideRevenue);
  liquidityPool.cumulativeTotalRevenueUSD =
    liquidityPool.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  liquidityPool.cumulativeProtocolSideRevenueUSD =
    liquidityPool.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenue);
  liquidityPool.cumulativeSupplySideRevenueUSD =
    liquidityPool.cumulativeSupplySideRevenueUSD.plus(supplySideRevenue);
  liquidityPool.cumulativeVolumeUSD =
    liquidityPool.cumulativeVolumeUSD.plus(amountInUSD);
  liquidityPool._cumulativeTradingFeeAmountUSD =
    liquidityPool._cumulativeTradingFeeAmountUSD.plus(tradingFeeAmountUSD);

  // update reward emission
  if (liquidityPool._latestRewardProgramID.gt(zeroBI)) {
    let programID = liquidityPool._latestRewardProgramID.toString();
    let rewardProgram = RewardProgram.load(programID);
    if (!rewardProgram) {
      log.warning(
        "[_handleTotalLiquidityUpdated] reward program {} not found",
        [programID]
      );
    } else if (
      rewardProgram.startTime.le(event.block.timestamp) &&
      rewardProgram.endTime.ge(event.block.timestamp) &&
      rewardProgram.enabled
    ) {
      let rewardAmountInDay = rewardProgram.rewardsRate.times(
        BigInt.fromI32(secondsPerDay)
      );
      let rewardAmountUSD = getDaiAmount(BntAddr, rewardAmountInDay);
      liquidityPool.rewardTokenEmissionsAmount = [rewardAmountInDay];
      liquidityPool.rewardTokenEmissionsUSD = [rewardAmountUSD];
    }
  }
  liquidityPool.save();

  updateProtocolRevenue();
  updateProtocolVolume();
  snapshotUsage(
    event.block.number,
    event.block.timestamp,
    event.params.trader.toHexString(),
    EventType.Swap
  );
  snapshotLiquidityPool(
    sourceToken._poolToken!,
    event.block.number,
    event.block.timestamp
  );
  updateLiquidityPoolSnapshotVolume(
    sourceToken._poolToken!,
    event.params.sourceAmount,
    amountInUSD,
    event.block.number,
    event.block.timestamp
  );
  updateLiquidityPoolSnapshotRevenue(
    sourceToken._poolToken!,
    tradingFeeAmountUSD,
    protocol._networkFeeRate,
    event.block.number,
    event.block.timestamp
  );
  snapshotFinancials(event.block.timestamp, event.block.number);
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
    log.warning("[handleTotalLiquidityUpdated] reserve token {} not found", [
      tokenAddress,
    ]);
    return;
  }

  if (!token._poolToken) {
    log.warning(
      "[handleTotalLiquidityUpdated] reserve token {} has no pool token",
      [tokenAddress]
    );
    return;
  }

  let poolToken = Token.load(token._poolToken!);
  if (!poolToken) {
    log.warning("[handleTotalLiquidityUpdated] pool token {} not found", [
      token._poolToken!,
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
    liquidityPool,
    token.id,
    event.params.stakedBalance,
    event.params.poolTokenSupply,
    poolToken.decimals
  );
}

export function handleBNTTotalLiquidityUpdated(
  event: BNTTotalLiquidityUpdated
): void {
  let bnBntToken = Token.load(BnBntAddr);
  if (!bnBntToken) {
    log.warning("[handleBNTTotalLiquidityUpdated] bnBNT token {} not found", [
      BnBntAddr,
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
    bnBntLiquidityPool,
    BntAddr,
    event.params.stakedBalance,
    event.params.poolTokenSupply,
    bnBntToken.decimals
  );
}

// currently each pool only has 1 reward program
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

  let rewardProgramID = event.params.programId.toString();
  let rewardProgram = new RewardProgram(rewardProgramID);
  rewardProgram.pool = liquidityPool.id;
  rewardProgram.enabled = true;
  rewardProgram.totalRewards = event.params.totalRewards;
  rewardProgram.startTime = event.params.startTime;
  rewardProgram.endTime = event.params.endTime;
  rewardProgram.rewardsRate = event.params.totalRewards.div(
    event.params.endTime.minus(event.params.startTime)
  );
  rewardProgram.save();

  liquidityPool._latestRewardProgramID = event.params.programId;
  liquidityPool.save();
}

export function handleProgramTerminated(event: ProgramTerminated): void {
  let programID = event.params.programId.toString();
  let rewardProgram = RewardProgram.load(programID);
  if (!rewardProgram) {
    log.warning("[handleProgramTerminated] reward program {} not found", [
      programID,
    ]);
    return;
  }

  rewardProgram.endTime = event.params.endTime;
  rewardProgram.save();
}

export function handleProgramEnabled(event: ProgramEnabled): void {
  let programID = event.params.programId.toString();
  let rewardProgram = RewardProgram.load(programID);
  if (!rewardProgram) {
    log.warning("[handleProgramTerminated] reward program {} not found", [
      programID,
    ]);
    return;
  }

  rewardProgram.enabled = event.params.status;
  rewardProgram.save();
}

function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(BancorNetworkAddr);
  if (!protocol) {
    protocol = new DexAmmProtocol(BancorNetworkAddr);
    protocol.name = "Bancor V3";
    protocol.slug = "bancor-v3";
    protocol.network = Network.MAINNET;
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalValueLockedUSD = zeroBD;
    protocol.cumulativeVolumeUSD = zeroBD;
    protocol.cumulativeSupplySideRevenueUSD = zeroBD;
    protocol.cumulativeProtocolSideRevenueUSD = zeroBD;
    protocol.cumulativeTotalRevenueUSD = zeroBD;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;
    protocol._poolIDs = [];
    protocol._defaultTradingFeeRate = zeroBD;
    protocol._networkFeeRate = zeroBD;
    protocol._withdrawalFeeRate = zeroBD;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}

function createLiquidityPool(
  reserveToken: Token,
  poolToken: Token,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): LiquidityPool {
  let protocol = getOrCreateProtocol();

  // init fees
  let withdrawalFee = new LiquidityPoolFee(
    LiquidityPoolFeeType.WITHDRAWAL_FEE.concat("-").concat(poolToken.id)
  );
  withdrawalFee.feePercentage = zeroBD;
  withdrawalFee.feeType = LiquidityPoolFeeType.WITHDRAWAL_FEE;
  withdrawalFee.save();

  let tradingFee = new LiquidityPoolFee(
    LiquidityPoolFeeType.DYNAMIC_TRADING_FEE.concat("-").concat(poolToken.id)
  );
  tradingFee.feePercentage = zeroBD;
  tradingFee.feeType = LiquidityPoolFeeType.DYNAMIC_TRADING_FEE;
  tradingFee.save();

  let protocolFee = new LiquidityPoolFee(
    LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE.concat("-").concat(poolToken.id)
  );
  protocolFee.feePercentage = zeroBD;
  protocolFee.feeType = LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE;
  protocolFee.save();

  let lpFee = new LiquidityPoolFee(
    LiquidityPoolFeeType.DYNAMIC_LP_FEE.concat("-").concat(poolToken.id)
  );
  lpFee.feePercentage = zeroBD;
  lpFee.feeType = LiquidityPoolFeeType.DYNAMIC_LP_FEE;
  lpFee.save();

  let rewardToken = new RewardToken(
    RewardTokenType.DEPOSIT.concat("-").concat(BntAddr)
  );
  rewardToken.token = BnBntAddr;
  rewardToken.type = RewardTokenType.DEPOSIT;
  rewardToken.save();

  let liquidityPool = new LiquidityPool(poolToken.id);
  liquidityPool.protocol = protocol.id;
  liquidityPool.name = poolToken.name;
  liquidityPool.symbol = poolToken.symbol;
  liquidityPool.inputTokens = [reserveToken.id];
  liquidityPool.outputToken = poolToken.id;
  liquidityPool.rewardTokens = [rewardToken.id];
  liquidityPool.fees = [
    withdrawalFee.id,
    tradingFee.id,
    protocolFee.id,
    lpFee.id,
  ];
  liquidityPool.isSingleSided = true;
  liquidityPool.createdTimestamp = blockTimestamp;
  liquidityPool.createdBlockNumber = blockNumber;
  liquidityPool.totalValueLockedUSD = zeroBD;
  liquidityPool.cumulativeTotalRevenueUSD = zeroBD;
  liquidityPool.cumulativeProtocolSideRevenueUSD = zeroBD;
  liquidityPool.cumulativeSupplySideRevenueUSD = zeroBD;
  liquidityPool.cumulativeVolumeUSD = zeroBD;
  liquidityPool.inputTokenBalances = [zeroBI];
  liquidityPool.inputTokenWeights = [new BigDecimal(BigInt.fromI32(1))];
  liquidityPool.outputTokenSupply = zeroBI;
  liquidityPool.outputTokenPriceUSD = zeroBD;
  liquidityPool.stakedOutputTokenAmount = zeroBI;
  liquidityPool.rewardTokenEmissionsAmount = [zeroBI];
  liquidityPool.rewardTokenEmissionsUSD = [zeroBD];
  liquidityPool._tradingFeeRate = protocol._defaultTradingFeeRate;
  liquidityPool._cumulativeTradingFeeAmountUSD = zeroBD;
  liquidityPool._cumulativeWithdrawalFeeAmountUSD = zeroBD;
  liquidityPool._latestRewardProgramID = zeroBI;
  liquidityPool.save();

  updateLiquidityPoolFees(poolToken.id);

  return liquidityPool;
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

  snapshotUsage(
    event.block.number,
    event.block.timestamp,
    depositer.toHexString(),
    EventType.Deposit
  );
  snapshotLiquidityPool(
    poolToken.id,
    event.block.number,
    event.block.timestamp
  );
  snapshotFinancials(event.block.timestamp, event.block.number);
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
  liquidityPool.cumulativeTotalRevenueUSD =
    liquidityPool.cumulativeTotalRevenueUSD.plus(withdrawalFeeAmountUSD);
  liquidityPool.cumulativeProtocolSideRevenueUSD =
    liquidityPool.cumulativeProtocolSideRevenueUSD.plus(withdrawalFeeAmountUSD);
  liquidityPool._cumulativeWithdrawalFeeAmountUSD =
    liquidityPool._cumulativeWithdrawalFeeAmountUSD.plus(
      withdrawalFeeAmountUSD
    );

  liquidityPool.save();

  updateProtocolRevenue();
  snapshotUsage(
    event.block.number,
    event.block.timestamp,
    withdrawer.toHexString(),
    EventType.Withdraw
  );
  snapshotLiquidityPool(
    poolToken.id,
    event.block.number,
    event.block.timestamp
  );
  snapshotFinancials(event.block.timestamp, event.block.number);
}

function _handleTotalLiquidityUpdated(
  liquidityPool: LiquidityPool,
  reserveTokenID: string,
  stakedBalance: BigInt,
  poolTokenSupply: BigInt,
  poolTokenDecimals: i32
): void {
  let prevTotalValueLockedUSD = liquidityPool.totalValueLockedUSD;
  let currTotalValueLockedUSD = getDaiAmount(reserveTokenID, stakedBalance);

  liquidityPool.inputTokenBalances = [stakedBalance];
  liquidityPool.totalValueLockedUSD = currTotalValueLockedUSD;
  liquidityPool.outputTokenSupply = poolTokenSupply;
  liquidityPool.outputTokenPriceUSD = getDaiAmount(
    reserveTokenID,
    getReserveTokenAmount(
      reserveTokenID,
      BigInt.fromI32(10).pow(poolTokenDecimals as u8) // 1 share of pool token
    )
  );
  liquidityPool.save();

  let protocol = DexAmmProtocol.load(BancorNetworkAddr);
  if (!protocol) {
    log.warning("[_handleTotalLiquidityUpdated] protocol not found", []);
    return;
  }
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD
    .plus(currTotalValueLockedUSD)
    .minus(prevTotalValueLockedUSD);
  protocol.save();
}

function getDaiAmount(
  sourceTokenID: string,
  sourceAmountMantissa: BigInt
): BigDecimal {
  if (sourceTokenID == DaiAddr) {
    return sourceAmountMantissa.toBigDecimal().div(exponentToBigDecimal(18));
  }
  let sourceToken = Token.load(sourceTokenID);
  if (!sourceToken) {
    log.warning("[getDaiAmount] token {} not found", [sourceTokenID]);
    return zeroBD;
  }
  let sourceAmount = sourceAmountMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(sourceToken.decimals));
  let priceUSD = getTokenPriceUSD(sourceTokenID, sourceToken.decimals);
  return sourceAmount.times(priceUSD);
}

// get usd price of a certain token
// by calling tradeOutputBySourceAmount method in BancorNetworkInfo
// potential optimization: store price at Token.lastPriceUSD
function getTokenPriceUSD(token: string, decimals: i32): BigDecimal {
  let info = BancorNetworkInfo.bind(Address.fromString(BancorNetworkInfoAddr));
  let daiAmountMantissaResult = info.try_tradeOutputBySourceAmount(
    Address.fromString(token),
    Address.fromString(DaiAddr),
    exponentToBigInt(decimals)
  );
  if (daiAmountMantissaResult.reverted) {
    log.warning(
      "[getTokenPriceUSD] try_tradeOutputBySourceAmount({}, {}, {}) reverted",
      [token, DaiAddr, exponentToBigInt(decimals).toString()]
    );
    return zeroBD;
  }
  // 18 = dai decimals
  return daiAmountMantissaResult.value
    .toBigDecimal()
    .div(exponentToBigDecimal(18));
}

function getReserveTokenAmount(
  reserveTokenID: string,
  poolTokenAmount: BigInt
): BigInt {
  let info = BancorNetworkInfo.bind(Address.fromString(BancorNetworkInfoAddr));
  let reserveTokenAmountResult = info.try_poolTokenToUnderlying(
    Address.fromString(reserveTokenID),
    poolTokenAmount
  );
  if (reserveTokenAmountResult.reverted) {
    log.warning(
      "[getReserveTokenAmount] try_poolTokenToUnderlying({}, {}) reverted",
      [reserveTokenID, poolTokenAmount.toString()]
    );
    return zeroBI;
  }
  return reserveTokenAmountResult.value;
}

function snapshotUsage(
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  accountID: string,
  eventType: EventType
): void {
  let protocol = DexAmmProtocol.load(BancorNetworkAddr);
  if (!protocol) {
    log.error("[snapshotUsage] Protocol not found, this SHOULD NOT happen", []);
    return;
  }
  let account = Account.load(accountID);
  if (!account) {
    account = new Account(accountID);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  //
  // daily snapshot
  //
  let dailySnapshotID = (blockTimestamp.toI32() / secondsPerDay).toString();
  let dailySnapshot = UsageMetricsDailySnapshot.load(dailySnapshotID);
  if (!dailySnapshot) {
    dailySnapshot = new UsageMetricsDailySnapshot(dailySnapshotID);
    dailySnapshot.protocol = protocol.id;
    dailySnapshot.dailyActiveUsers = 0;
    dailySnapshot.cumulativeUniqueUsers = 0;
    dailySnapshot.totalPoolCount = 0;
    dailySnapshot.dailyTransactionCount = 0;
    dailySnapshot.dailyDepositCount = 0;
    dailySnapshot.dailyWithdrawCount = 0;
    dailySnapshot.dailySwapCount = 0;
    dailySnapshot.blockNumber = blockNumber;
    dailySnapshot.timestamp = blockTimestamp;
  }
  let dailyAccountID = accountID.concat("-").concat(dailySnapshotID);
  let dailyActiveAccount = ActiveAccount.load(dailyAccountID);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyAccountID);
    dailyActiveAccount.save();

    dailySnapshot.dailyActiveUsers += 1;
  }
  dailySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  dailySnapshot.totalPoolCount = protocol.totalPoolCount;
  dailySnapshot.dailyTransactionCount += 1;
  switch (eventType) {
    case EventType.Deposit:
      dailySnapshot.dailyDepositCount += 1;
      break;
    case EventType.Withdraw:
      dailySnapshot.dailyWithdrawCount += 1;
      break;
    case EventType.Swap:
      dailySnapshot.dailySwapCount += 1;
      break;
    default:
  }
  dailySnapshot.blockNumber = blockNumber;
  dailySnapshot.timestamp = blockTimestamp;
  dailySnapshot.save();

  //
  // hourly snapshot
  //
  let hourlySnapshotID = (blockTimestamp.toI32() / secondsPerHour).toString();
  let hourlySnapshot = UsageMetricsHourlySnapshot.load(hourlySnapshotID);
  if (!hourlySnapshot) {
    hourlySnapshot = new UsageMetricsHourlySnapshot(hourlySnapshotID);
    hourlySnapshot.protocol = protocol.id;
    hourlySnapshot.hourlyActiveUsers = 0;
    hourlySnapshot.cumulativeUniqueUsers = 0;
    hourlySnapshot.hourlyTransactionCount = 0;
    hourlySnapshot.hourlyDepositCount = 0;
    hourlySnapshot.hourlyWithdrawCount = 0;
    hourlySnapshot.hourlySwapCount = 0;
    hourlySnapshot.blockNumber = blockNumber;
    hourlySnapshot.timestamp = blockTimestamp;
  }
  let hourlyAccountID = accountID.concat("-").concat(hourlySnapshotID);
  let hourlyActiveAccount = ActiveAccount.load(hourlyAccountID);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyAccountID);
    hourlyActiveAccount.save();

    hourlySnapshot.hourlyActiveUsers += 1;
  }
  hourlySnapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  hourlySnapshot.hourlyTransactionCount += 1;
  switch (eventType) {
    case EventType.Deposit:
      hourlySnapshot.hourlyDepositCount += 1;
      break;
    case EventType.Withdraw:
      hourlySnapshot.hourlyWithdrawCount += 1;
      break;
    case EventType.Swap:
      hourlySnapshot.hourlySwapCount += 1;
      break;
    default:
  }
  hourlySnapshot.blockNumber = blockNumber;
  hourlySnapshot.timestamp = blockTimestamp;
  hourlySnapshot.save();
}

function snapshotLiquidityPool(
  liquidityPoolID: string,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  let liquidityPool = LiquidityPool.load(liquidityPoolID);
  if (!liquidityPool) {
    log.warning("[snapshotLiquidityPool] liquidity pool {} not found", [
      liquidityPoolID,
    ]);
    return;
  }

  //
  // daily snapshot
  //
  let dailySnapshot = getOrCreateLiquidityPoolDailySnapshot(
    liquidityPoolID,
    blockTimestamp,
    blockNumber
  );
  dailySnapshot.totalValueLockedUSD = liquidityPool.totalValueLockedUSD;
  dailySnapshot.cumulativeTotalRevenueUSD =
    liquidityPool.cumulativeTotalRevenueUSD;
  dailySnapshot.cumulativeProtocolSideRevenueUSD =
    liquidityPool.cumulativeProtocolSideRevenueUSD;
  dailySnapshot.cumulativeSupplySideRevenueUSD =
    liquidityPool.cumulativeSupplySideRevenueUSD;
  dailySnapshot.cumulativeVolumeUSD = liquidityPool.cumulativeVolumeUSD;
  dailySnapshot.inputTokenBalances = [liquidityPool.inputTokenBalances[0]];
  dailySnapshot.inputTokenWeights = [liquidityPool.inputTokenWeights[0]];
  dailySnapshot.outputTokenSupply = liquidityPool.outputTokenSupply;
  dailySnapshot.outputTokenPriceUSD = liquidityPool.outputTokenPriceUSD;
  dailySnapshot.stakedOutputTokenAmount = liquidityPool.stakedOutputTokenAmount;
  dailySnapshot.rewardTokenEmissionsAmount = [
    liquidityPool.rewardTokenEmissionsAmount![0],
  ];
  dailySnapshot.rewardTokenEmissionsUSD = liquidityPool.rewardTokenEmissionsUSD;
  dailySnapshot.save();

  //
  // hourly snapshot
  //
  let hourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(
    liquidityPoolID,
    blockTimestamp,
    blockNumber
  );
  hourlySnapshot.totalValueLockedUSD = liquidityPool.totalValueLockedUSD;
  hourlySnapshot.cumulativeTotalRevenueUSD =
    liquidityPool.cumulativeTotalRevenueUSD;
  hourlySnapshot.cumulativeProtocolSideRevenueUSD =
    liquidityPool.cumulativeProtocolSideRevenueUSD;
  hourlySnapshot.cumulativeSupplySideRevenueUSD =
    liquidityPool.cumulativeSupplySideRevenueUSD;
  hourlySnapshot.cumulativeVolumeUSD = liquidityPool.cumulativeVolumeUSD;
  hourlySnapshot.inputTokenBalances = [liquidityPool.inputTokenBalances[0]];
  hourlySnapshot.inputTokenWeights = [liquidityPool.inputTokenWeights[0]];
  hourlySnapshot.outputTokenSupply = liquidityPool.outputTokenSupply;
  hourlySnapshot.outputTokenPriceUSD = liquidityPool.outputTokenPriceUSD;
  hourlySnapshot.stakedOutputTokenAmount =
    liquidityPool.stakedOutputTokenAmount;
  hourlySnapshot.rewardTokenEmissionsAmount = [
    liquidityPool.rewardTokenEmissionsAmount![0],
  ];
  hourlySnapshot.rewardTokenEmissionsUSD =
    liquidityPool.rewardTokenEmissionsUSD;
  hourlySnapshot.save();
}

function updateLiquidityPoolSnapshotVolume(
  liquidityPoolID: string,
  amount: BigInt,
  amountUSD: BigDecimal,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  //
  // daily snapshot
  //
  let dailySnapshot = getOrCreateLiquidityPoolDailySnapshot(
    liquidityPoolID,
    blockTimestamp,
    blockNumber
  );
  dailySnapshot.dailyVolumeByTokenAmount = [
    dailySnapshot.dailyVolumeByTokenAmount[0].plus(amount),
  ];
  dailySnapshot.dailyVolumeByTokenUSD = [
    dailySnapshot.dailyVolumeByTokenUSD[0].plus(amountUSD),
  ];
  dailySnapshot.dailyVolumeUSD = dailySnapshot.dailyVolumeByTokenUSD[0];
  dailySnapshot.save();

  //
  // hourly snapshot
  //
  let hourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(
    liquidityPoolID,
    blockTimestamp,
    blockNumber
  );
  hourlySnapshot.hourlyVolumeByTokenAmount = [
    hourlySnapshot.hourlyVolumeByTokenAmount[0].plus(amount),
  ];
  hourlySnapshot.hourlyVolumeByTokenUSD = [
    hourlySnapshot.hourlyVolumeByTokenUSD[0].plus(amountUSD),
  ];
  hourlySnapshot.hourlyVolumeUSD = hourlySnapshot.hourlyVolumeByTokenUSD[0];
  hourlySnapshot.save();
}

function updateLiquidityPoolSnapshotRevenue(
  liquidityPoolID: string,
  revenue: BigDecimal,
  networkFeeRate: BigDecimal,
  blockNumber: BigInt,
  blockTimestamp: BigInt
): void {
  let protocolSideRevenue = revenue.times(networkFeeRate);
  let supplySideRevenue = revenue.minus(protocolSideRevenue);

  //
  // daily snapshot
  //
  let dailySnapshot = getOrCreateLiquidityPoolDailySnapshot(
    liquidityPoolID,
    blockTimestamp,
    blockNumber
  );
  dailySnapshot.dailyTotalRevenueUSD =
    dailySnapshot.dailyTotalRevenueUSD.plus(revenue);
  dailySnapshot.dailyProtocolSideRevenueUSD =
    dailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenue);
  dailySnapshot.dailySupplySideRevenueUSD =
    dailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenue);
  dailySnapshot.save();

  //
  // hourly snapshot
  //
  let hourlySnapshot = getOrCreateLiquidityPoolHourlySnapshot(
    liquidityPoolID,
    blockTimestamp,
    blockNumber
  );
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(revenue);
  hourlySnapshot.hourlyProtocolSideRevenueUSD =
    hourlySnapshot.hourlyProtocolSideRevenueUSD.plus(protocolSideRevenue);
  hourlySnapshot.hourlySupplySideRevenueUSD =
    hourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenue);
  hourlySnapshot.save();
}

function updateProtocolRevenue(): void {
  let protocol = DexAmmProtocol.load(BancorNetworkAddr);
  if (!protocol) {
    log.warning("[updateProtocolRevenue] protocol not found", []);
    return;
  }

  let cumulativeTotalRevenueUSD = zeroBD;
  let cumulativeProtocolSideRevenueUSD = zeroBD;
  let cumulativeSupplySideRevenueUSD = zeroBD;

  for (let i = 0; i < protocol._poolIDs.length; i++) {
    let liquidityPool = LiquidityPool.load(protocol._poolIDs[i]);
    if (!liquidityPool) {
      log.warning("[updateProtocolRevenue] liqudity pool {} not found", [
        protocol._poolIDs[i],
      ]);
      return;
    }

    cumulativeTotalRevenueUSD = cumulativeTotalRevenueUSD.plus(
      liquidityPool.cumulativeTotalRevenueUSD
    );
    cumulativeProtocolSideRevenueUSD = cumulativeProtocolSideRevenueUSD.plus(
      liquidityPool.cumulativeProtocolSideRevenueUSD
    );
    cumulativeSupplySideRevenueUSD = cumulativeSupplySideRevenueUSD.plus(
      liquidityPool.cumulativeSupplySideRevenueUSD
    );
  }

  protocol.cumulativeTotalRevenueUSD = cumulativeTotalRevenueUSD;
  protocol.cumulativeProtocolSideRevenueUSD = cumulativeProtocolSideRevenueUSD;
  protocol.cumulativeSupplySideRevenueUSD = cumulativeSupplySideRevenueUSD;
  protocol.save();
}

function updateProtocolVolume(): void {
  let protocol = DexAmmProtocol.load(BancorNetworkAddr);
  if (!protocol) {
    log.warning("[updateProtocolVolume] protocol not found", []);
    return;
  }

  let cumulativeVolumeUSD = zeroBD;

  for (let i = 0; i < protocol._poolIDs.length; i++) {
    let liquidityPool = LiquidityPool.load(protocol._poolIDs[i]);
    if (!liquidityPool) {
      log.warning("[updateProtocolVolume] liqudity pool {} not found", [
        protocol._poolIDs[i],
      ]);
      return;
    }

    cumulativeVolumeUSD = cumulativeVolumeUSD.plus(
      liquidityPool.cumulativeVolumeUSD
    );
  }

  protocol.cumulativeVolumeUSD = cumulativeVolumeUSD;
  protocol.save();
}

function snapshotFinancials(blockTimestamp: BigInt, blockNumber: BigInt): void {
  let protocol = DexAmmProtocol.load(BancorNetworkAddr);
  if (!protocol) {
    log.warning("[snapshotFinancials] protocol not found", []);
    return;
  }

  let snapshot = getOrCreateFinancialsDailySnapshot(blockTimestamp);

  snapshot.timestamp = blockTimestamp;
  snapshot.blockNumber = blockNumber;
  snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  snapshot.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;

  let dailyVolumeUSD = zeroBD;
  let dailyTotalRevenueUSD = zeroBD;
  let dailyProtocolSideRevenueUSD = zeroBD;
  let dailySupplySideRevenueUSD = zeroBD;

  for (let i = 0; i < protocol._poolIDs.length; i++) {
    let liquidityPool = LiquidityPool.load(protocol._poolIDs[i]);
    if (!liquidityPool) {
      log.warning("[snapshotFinancials] liqudity pool {} not found", [
        protocol._poolIDs[i],
      ]);
      return;
    }

    let liquidityPoolDailySnapshotID = getLiquidityPoolDailySnapshotID(
      liquidityPool.id,
      blockTimestamp.toI32()
    );
    let liquidityPoolDailySnapshot = LiquidityPoolDailySnapshot.load(
      liquidityPoolDailySnapshotID
    );
    if (!liquidityPoolDailySnapshot) {
      log.warning(
        "[snapshotFinancials] liquidity pool daily snapshot {} not found",
        [liquidityPoolDailySnapshotID]
      );
      continue;
    }
    dailyVolumeUSD = dailyVolumeUSD.plus(
      liquidityPoolDailySnapshot.dailyVolumeUSD
    );
    dailyTotalRevenueUSD = dailyTotalRevenueUSD.plus(
      liquidityPoolDailySnapshot.dailyTotalRevenueUSD
    );
    dailyProtocolSideRevenueUSD = dailyProtocolSideRevenueUSD.plus(
      liquidityPoolDailySnapshot.dailyProtocolSideRevenueUSD
    );
    dailySupplySideRevenueUSD = dailySupplySideRevenueUSD.plus(
      liquidityPoolDailySnapshot.dailySupplySideRevenueUSD
    );
  }

  snapshot.dailyVolumeUSD = dailyVolumeUSD;
  snapshot.dailyTotalRevenueUSD = dailyTotalRevenueUSD;
  snapshot.dailyProtocolSideRevenueUSD = dailyProtocolSideRevenueUSD;
  snapshot.dailySupplySideRevenueUSD = dailySupplySideRevenueUSD;
  snapshot.save();

  // protocol controlled value usd = bnt_amount * bnt_price
  let bntLiquidityPool = LiquidityPool.load(BnBntAddr);
  if (!bntLiquidityPool) {
    log.warning("[snapshotFinancials] bnBNT liquidity pool not found", []);
    return;
  }
  if (!bntLiquidityPool.outputTokenSupply) {
    log.warning(
      "[snapshotFinancials] bnBNT liquidity pool has no outputTokenSupply",
      []
    );
    return;
  }

  let bntAmount = getReserveTokenAmount(
    BntAddr,
    bntLiquidityPool.outputTokenSupply!
  );
  snapshot.protocolControlledValueUSD = getDaiAmount(BntAddr, bntAmount);
  snapshot.save();
}

function getOrCreateFinancialsDailySnapshot(
  blockTimestamp: BigInt
): FinancialsDailySnapshot {
  let snapshotID = (blockTimestamp.toI32() / secondsPerDay).toString();
  let snapshot = FinancialsDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new FinancialsDailySnapshot(snapshotID);

    snapshot.protocol = BancorNetworkAddr;
    snapshot.blockNumber = zeroBI;
    snapshot.timestamp = zeroBI;
    snapshot.totalValueLockedUSD = zeroBD;
    snapshot.protocolControlledValueUSD = zeroBD;
    snapshot.dailyVolumeUSD = zeroBD;
    snapshot.dailyTotalRevenueUSD = zeroBD;
    snapshot.dailySupplySideRevenueUSD = zeroBD;
    snapshot.dailyProtocolSideRevenueUSD = zeroBD;
    snapshot.cumulativeVolumeUSD = zeroBD;
    snapshot.cumulativeTotalRevenueUSD = zeroBD;
    snapshot.cumulativeSupplySideRevenueUSD = zeroBD;
    snapshot.cumulativeProtocolSideRevenueUSD = zeroBD;
    snapshot.save();
  }

  return snapshot;
}

function getOrCreateLiquidityPoolDailySnapshot(
  liquidityPoolID: string,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): LiquidityPoolDailySnapshot {
  let snapshotID = getLiquidityPoolDailySnapshotID(
    liquidityPoolID,
    blockTimestamp.toI32()
  );
  let snapshot = LiquidityPoolDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new LiquidityPoolDailySnapshot(snapshotID);
    snapshot.blockNumber = blockNumber;
    snapshot.timestamp = blockTimestamp;

    snapshot.protocol = BancorNetworkAddr;
    snapshot.pool = liquidityPoolID;
    snapshot.totalValueLockedUSD = zeroBD;
    snapshot.cumulativeTotalRevenueUSD = zeroBD;
    snapshot.cumulativeProtocolSideRevenueUSD = zeroBD;
    snapshot.cumulativeSupplySideRevenueUSD = zeroBD;
    snapshot.dailyTotalRevenueUSD = zeroBD;
    snapshot.dailyProtocolSideRevenueUSD = zeroBD;
    snapshot.dailySupplySideRevenueUSD = zeroBD;
    snapshot.cumulativeVolumeUSD = zeroBD;
    snapshot.inputTokenBalances = [zeroBI];
    snapshot.inputTokenWeights = [zeroBD];
    snapshot.outputTokenSupply = zeroBI;
    snapshot.outputTokenPriceUSD = zeroBD;
    snapshot.stakedOutputTokenAmount = zeroBI;
    snapshot.rewardTokenEmissionsAmount = [zeroBI];
    snapshot.rewardTokenEmissionsUSD = [zeroBD];

    snapshot.dailyVolumeUSD = zeroBD;
    snapshot.dailyVolumeByTokenAmount = [zeroBI];
    snapshot.dailyVolumeByTokenUSD = [zeroBD];
  }

  return snapshot;
}

function getOrCreateLiquidityPoolHourlySnapshot(
  liquidityPoolID: string,
  blockTimestamp: BigInt,
  blockNumber: BigInt
): LiquidityPoolHourlySnapshot {
  let snapshotID = getLiquidityPoolHourlySnapshotID(
    liquidityPoolID,
    blockTimestamp.toI32()
  );
  let snapshot = LiquidityPoolHourlySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new LiquidityPoolHourlySnapshot(snapshotID);
    snapshot.blockNumber = blockNumber;
    snapshot.timestamp = blockTimestamp;

    snapshot.protocol = BancorNetworkAddr;
    snapshot.pool = liquidityPoolID;
    snapshot.totalValueLockedUSD = zeroBD;
    snapshot.cumulativeTotalRevenueUSD = zeroBD;
    snapshot.cumulativeProtocolSideRevenueUSD = zeroBD;
    snapshot.cumulativeSupplySideRevenueUSD = zeroBD;
    snapshot.hourlyTotalRevenueUSD = zeroBD;
    snapshot.hourlyProtocolSideRevenueUSD = zeroBD;
    snapshot.hourlySupplySideRevenueUSD = zeroBD;
    snapshot.cumulativeVolumeUSD = zeroBD;
    snapshot.inputTokenBalances = [zeroBI];
    snapshot.inputTokenWeights = [zeroBD];
    snapshot.outputTokenSupply = zeroBI;
    snapshot.outputTokenPriceUSD = zeroBD;
    snapshot.stakedOutputTokenAmount = zeroBI;
    snapshot.rewardTokenEmissionsAmount = [zeroBI];
    snapshot.rewardTokenEmissionsUSD = [zeroBD];

    snapshot.hourlyVolumeUSD = zeroBD;
    snapshot.hourlyVolumeByTokenAmount = [zeroBI];
    snapshot.hourlyVolumeByTokenUSD = [zeroBD];
  }

  return snapshot;
}

function getLiquidityPoolDailySnapshotID(
  liquidityPoolID: string,
  timestamp: i32
): string {
  return liquidityPoolID
    .concat("-")
    .concat((timestamp / secondsPerDay).toString());
}

function getLiquidityPoolHourlySnapshotID(
  liquidityPoolID: string,
  timestamp: i32
): string {
  return liquidityPoolID
    .concat("-")
    .concat((timestamp / secondsPerHour).toString());
}

function updateLiquidityPoolFees(liquidityPoolID: string): void {
  let protocol = DexAmmProtocol.load(BancorNetworkAddr);
  if (!protocol) {
    log.warning("[updateLiquidityPoolFees] protocol not found", []);
    return;
  }
  let liquidityPool = LiquidityPool.load(liquidityPoolID);
  if (!liquidityPool) {
    log.warning("[updateLiquidityPoolFees] liquidity pool {} not found", [
      liquidityPoolID,
    ]);
    return;
  }

  let withdrawFee = LiquidityPoolFee.load(liquidityPool.fees[withdrawFeeIdx]);
  if (!withdrawFee) {
    log.warning("[updateLiquidityPoolFees] fee {} not found", [
      liquidityPool.fees[withdrawFeeIdx],
    ]);
  } else {
    withdrawFee.feePercentage = protocol._withdrawalFeeRate.times(hundredBD);
    withdrawFee.save();
  }

  let tradingFee = LiquidityPoolFee.load(liquidityPool.fees[tradingFeeIdx]);
  if (!tradingFee) {
    log.warning("[updateLiquidityPoolFees] fee {} not found", [
      liquidityPool.fees[tradingFeeIdx],
    ]);
  } else {
    tradingFee.feePercentage = liquidityPool._tradingFeeRate.times(hundredBD);
    tradingFee.save();
  }

  let protocolFee = LiquidityPoolFee.load(liquidityPool.fees[protocolFeeIdx]);
  if (!protocolFee) {
    log.warning("[updateLiquidityPoolFees] fee {} not found", [
      liquidityPool.fees[protocolFeeIdx],
    ]);
  } else {
    protocolFee.feePercentage = liquidityPool._tradingFeeRate
      .times(protocol._networkFeeRate)
      .times(hundredBD);
    protocolFee.save();
  }

  let lpFee = LiquidityPoolFee.load(liquidityPool.fees[lpFeeIdx]);
  if (!lpFee) {
    log.warning("[updateLiquidityPoolFees] fee {} not found", [
      liquidityPool.fees[lpFeeIdx],
    ]);
  } else {
    lpFee.feePercentage = liquidityPool._tradingFeeRate
      .times(oneBD.minus(protocol._networkFeeRate))
      .times(hundredBD);
    lpFee.save();
  }
}
