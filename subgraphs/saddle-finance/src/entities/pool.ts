import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  _TokenPools,
  Deposit,
  LiquidityPool,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  Swap as SwapEvent,
  Token,
  Withdraw,
} from "../../generated/schema";
import { Swap } from "../../generated/templates/Swap/Swap";
import { SwapV1 } from "../../generated/templates/Swap/SwapV1";
import { Swap as SwapTemplate } from "../../generated/templates";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BROKEN_POOLS,
  POOL_DATA,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  ZERO_ADDRESS,
} from "../utils/constants";
import {
  bigIntToBigDecimal,
  bigDecimalToBigInt,
  calculateAverage,
} from "../utils/numbers";
import { getProtocolFee, getSupplySideFee, createOrUpdateAllFees } from "./fee";
import {
  addProtocolUSDRevenue,
  addProtocolUSDVolume,
  getOrCreateProtocol,
  incrementProtocolDepositCount,
  incrementProtocolSwapCount,
  incrementProtocolTotalPoolCount,
  incrementProtocolWithdrawCount,
  updateProtocolTVL,
} from "./protocol";
import {
  checkValidToken,
  getOrCreateRewardToken,
  getOrCreateToken,
  getOrCreateTokenFromString,
  getTokenDecimals,
} from "./token";
import { getPriceUSD, getTokenAmountsSumUSD } from "../utils/price";
import { prefixID } from "../utils/strings";
import { MiniChefV2 } from "../../generated/templates/Swap/MiniChefV2";
import { NewSwapPool } from "../../generated/templates/Swap/SwapDeployer";
import { SimpleRewarder } from "../../generated/templates/Swap/SimpleRewarder";

export function getOrCreatePool(address: Address): LiquidityPool {
  let pool = LiquidityPool.load(address.toHexString());
  if (!pool) {
    // Pool was not created through a SwapDeployer nor Registry
    pool = createPoolFromAddress(address);
  }
  return pool;
}

// createPoolFromAddress will create a pool in the DB but won't subscribe to it via template
// because it should already be in the yaml.
function createPoolFromAddress(address: Address): LiquidityPool {
  const poolData = POOL_DATA.get(
    prefixID(dataSource.network(), address.toHexString())
  );

  const pool = createPool(address, poolData.createdBlockNumber, poolData.createdTimestamp, null);
  if (!pool) {
    log.critical("unable to create pool from address", [])
  }
  return pool!
}

// createPoolFromEvent will create a pool from a PairCreated event, and subscribe to events from it.
export function createPoolFromFactoryEvent(event: NewSwapPool): void {
  const poolAddr = event.params.swapAddress;
  if (BROKEN_POOLS.has(poolAddr.toHexString())) {
    return;
  }

  const pool = LiquidityPool.load(poolAddr.toHexString());
  if (pool) {
    return;
  }


  if (createPool(poolAddr, event.block.number, event.block.timestamp, event.params.pooledTokens)) {
    SwapTemplate.create(poolAddr);
  }
}

// createPoolFromRegistryEvent will create a pool if doesn't exist already when added to the pool registry.
// This should catch pools deployed manually and not via a deployer.
export function createPoolFromRegistryEvent(address: Address, block: ethereum.Block): void {
  if (BROKEN_POOLS.has(address.toHexString())) {
    return;
  }

  const pool = LiquidityPool.load(address.toHexString());
  if (pool) {
    return;
  }

  if (createPool(address, block.number, block.timestamp, null)) {
    SwapTemplate.create(address);
  }
}

function createPool(
  swapAddress: Address,
  blockNum: BigInt,
  timestamp: BigInt,
  pooledTokens: Address[] | null
): LiquidityPool | null {
  const address = swapAddress;
  const addressString = address.toHexString();

  const contract = Swap.bind(address);
  let lpTokenAddress = contract.swapStorage().value6;
  // Check if LP token exists
  if (!checkValidToken(lpTokenAddress)) {
    const v1contract = SwapV1.bind(address);
    lpTokenAddress = v1contract.swapStorage().value7;
    if (!checkValidToken(lpTokenAddress)) {
      log.critical("Invalid LP token address {} in pool {}", [
        lpTokenAddress.toHexString(),
        address.toHexString(),
      ]);
      return null
    }
  }

  if (!pooledTokens) {
    pooledTokens = fetchInputTokensFromContract(contract);
  }

  const pool = new LiquidityPool(addressString);
  pool.protocol = getOrCreateProtocol().id;
  pool._inputTokensOrdered = getOrCreateInputTokens(pooledTokens);
  pool.inputTokens = pool._inputTokensOrdered.sort();
  const token = getOrCreateToken(lpTokenAddress, addressString);
  pool.outputToken = token.id;
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.createdTimestamp = timestamp;
  pool.createdBlockNumber = blockNum;
  pool.name = token.name;
  pool.symbol = token.symbol;
  const tradingFee = contract.swapStorage().value4; // swapFee
  const adminFee = contract.swapStorage().value5; // adminFee
  pool.fees = createOrUpdateAllFees(address, tradingFee, adminFee);
  pool._basePool = getBasePool(contract);
  setInputTokenBalancesAndWeights(pool, contract);

  pool.isSingleSided = false;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.save();
  incrementProtocolTotalPoolCount();
  registerPoolForTokens(pool);
  return pool;
}

export function getOrCreatePoolDailySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool
): LiquidityPoolDailySnapshot {
  const day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = `${pool.id}-${day}`;
  let poolDailySnapshot = LiquidityPoolDailySnapshot.load(id);
  if (!poolDailySnapshot) {
    poolDailySnapshot = new LiquidityPoolDailySnapshot(id);
    poolDailySnapshot.protocol = pool.protocol;
    poolDailySnapshot.pool = pool.id;
    poolDailySnapshot.dailyVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).map<BigInt>(() => BIGINT_ZERO);
    poolDailySnapshot.dailyVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).map<BigDecimal>(() => BIGDECIMAL_ZERO);

    poolDailySnapshot.dailyVolumeUSD = BIGDECIMAL_ZERO;
    poolDailySnapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolDailySnapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolDailySnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }
  poolDailySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolDailySnapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolDailySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolDailySnapshot.inputTokenWeights = pool.inputTokenWeights;
  poolDailySnapshot.outputTokenSupply = pool.outputTokenSupply;
  poolDailySnapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolDailySnapshot.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolDailySnapshot.rewardTokenEmissionsAmount =
    pool.rewardTokenEmissionsAmount;
  poolDailySnapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  poolDailySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolDailySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolDailySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  poolDailySnapshot.blockNumber = event.block.number;
  poolDailySnapshot.timestamp = event.block.timestamp;
  poolDailySnapshot.save();
  return poolDailySnapshot;
}

export function getOrCreatePoolHourlySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool
): LiquidityPoolHourlySnapshot {
  const timestamp = event.block.timestamp.toI64();
  const hours: i64 = timestamp / SECONDS_PER_HOUR;
  const id = `${pool.id}-${hours}`;
  let poolHourlySnapshot = LiquidityPoolHourlySnapshot.load(id);
  if (!poolHourlySnapshot) {
    poolHourlySnapshot = new LiquidityPoolHourlySnapshot(id);
    poolHourlySnapshot.protocol = pool.protocol;
    poolHourlySnapshot.pool = pool.id;
    poolHourlySnapshot.hourlyVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).map<BigInt>(() => BIGINT_ZERO);
    poolHourlySnapshot.hourlyVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).map<BigDecimal>(() => BIGDECIMAL_ZERO);

    poolHourlySnapshot.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    poolHourlySnapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    poolHourlySnapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    poolHourlySnapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }
  poolHourlySnapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolHourlySnapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolHourlySnapshot.inputTokenBalances = pool.inputTokenBalances;
  poolHourlySnapshot.inputTokenWeights = pool.inputTokenWeights;
  poolHourlySnapshot.outputTokenSupply = pool.outputTokenSupply;
  poolHourlySnapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolHourlySnapshot.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolHourlySnapshot.rewardTokenEmissionsAmount =
    pool.rewardTokenEmissionsAmount;
  poolHourlySnapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  poolHourlySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolHourlySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;

  poolHourlySnapshot.blockNumber = event.block.number;
  poolHourlySnapshot.timestamp = event.block.timestamp;
  poolHourlySnapshot.save();

  return poolHourlySnapshot;
}

export function handlePoolDeposit(
  event: ethereum.Event,
  pool: LiquidityPool,
  deposit: Deposit
): void {
  setInputTokenBalancesAndWeights(pool);
  pool.outputTokenSupply = pool.outputTokenSupply!.plus(
    deposit.outputTokenAmount!
  );
  updateOutputTokenPriceAndTVL(event, pool);
  updateRewardTokenEmissionsUSD(event, pool);
  pool.save();
  getOrCreatePoolDailySnapshot(event, pool);
  getOrCreatePoolHourlySnapshot(event, pool);
  incrementProtocolDepositCount(event);
}

export function handlePoolWithdraw(
  event: ethereum.Event,
  pool: LiquidityPool,
  withdraw: Withdraw
): void {
  setInputTokenBalancesAndWeights(pool);
  pool.outputTokenSupply = pool.outputTokenSupply!.minus(
    withdraw.outputTokenAmount!
  );
  updateOutputTokenPriceAndTVL(event, pool);
  updateRewardTokenEmissionsUSD(event, pool);
  pool.save();
  getOrCreatePoolDailySnapshot(event, pool);
  getOrCreatePoolHourlySnapshot(event, pool);
  incrementProtocolWithdrawCount(event);
}

export function handlePoolSwap(
  event: ethereum.Event,
  pool: LiquidityPool,
  swap: SwapEvent
): void {
  const volumeUSD = calculateAverage([swap.amountInUSD, swap.amountOutUSD]);
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(volumeUSD);
  setInputTokenBalancesAndWeights(pool);
  updateOutputTokenPriceAndTVL(event, pool);
  updateRewardTokenEmissionsUSD(event, pool);
  pool.save();
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyVolumeUSD = dailySnapshot.dailyVolumeUSD.plus(volumeUSD);
  dailySnapshot.dailyVolumeByTokenAmount = addTokenVolume(
    dailySnapshot.dailyVolumeByTokenAmount,
    swap,
    pool
  );
  dailySnapshot.dailyVolumeByTokenUSD = addTokenVolumeUSD(
    dailySnapshot.dailyVolumeByTokenUSD,
    swap,
    pool
  );
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  hourlySnapshot.hourlyVolumeUSD =
    hourlySnapshot.hourlyVolumeUSD.plus(volumeUSD);
  hourlySnapshot.hourlyVolumeByTokenAmount = addTokenVolume(
    hourlySnapshot.hourlyVolumeByTokenAmount,
    swap,
    pool
  );
  hourlySnapshot.hourlyVolumeByTokenUSD = addTokenVolumeUSD(
    hourlySnapshot.hourlyVolumeByTokenUSD,
    swap,
    pool
  );
  hourlySnapshot.save();
  incrementProtocolSwapCount(event);
  addProtocolUSDVolume(event, volumeUSD);
  const supplySideRevenueUSD = swap.amountInUSD.times(
    getSupplySideFee(pool.id)
  );
  const protocolRevenueUSD = swap.amountInUSD.times(getProtocolFee(pool.id));
  addProtocolUSDRevenue(event, pool, supplySideRevenueUSD, protocolRevenueUSD);
}

export function handlePoolRewardsUpdated(
  event: ethereum.Event,
  miniChef: MiniChefV2,
  pid: BigInt,
  stakedAmountChange: BigInt = BIGINT_ZERO
): void {
  const lpTokenAddress = miniChef.lpToken(pid);
  if (lpTokenAddress.toHexString() == ZERO_ADDRESS) {
    return;
  }

  if (isBrokenMinichefPool(lpTokenAddress)) {
    return;
  }

  const poolInfo = miniChef.poolInfo(pid);
  const poolAllocPoint = poolInfo.value2;
  const saddlePerSecond = miniChef.saddlePerSecond();
  const totalAllocPoint = miniChef.totalAllocPoint();
  const token = getOrCreateToken(lpTokenAddress);
  if (!token._pool) {
    log.error("Could not find source pool for LP token: {}", [
      lpTokenAddress.toHexString(),
    ]);
    return;
  }
  const pool = getOrCreatePool(Address.fromString(token._pool!));
  const sdlRewardsPerDay = saddlePerSecond
    .times(BigInt.fromI64(SECONDS_PER_DAY))
    .times(poolAllocPoint)
    .div(totalAllocPoint);
  const rewardTokenEmissions = [sdlRewardsPerDay];
  const rewardTokens = [getOrCreateRewardToken(miniChef.SADDLE()).id];
  const rewarderAddress = miniChef.rewarder(pid);
  if (rewarderAddress.toHexString() != ZERO_ADDRESS) {
    const rewarder = SimpleRewarder.bind(rewarderAddress);
    const rewardTokenAddress = rewarder.rewardToken();
    if (!checkValidToken(rewardTokenAddress)) {
      log.error("Invalid reward token: {}", [rewardTokenAddress.toHexString()]);
    } else {
      const rewardPerSecond = rewarder.rewardPerSecond();
      const rewardPerDay = rewardPerSecond.times(
        BigInt.fromI64(SECONDS_PER_DAY)
      );
      rewardTokens.push(getOrCreateRewardToken(rewardTokenAddress).id);
      rewardTokenEmissions.push(rewardPerDay);
    }
  }
  pool.rewardTokens = rewardTokens;
  pool.rewardTokenEmissionsAmount = rewardTokenEmissions;
  updateRewardTokenEmissionsUSD(event, pool);
  if (!pool.stakedOutputTokenAmount) {
    pool.stakedOutputTokenAmount = BIGINT_ZERO;
  }
  pool.stakedOutputTokenAmount =
    pool.stakedOutputTokenAmount!.plus(stakedAmountChange);
  pool.save();
  getOrCreatePoolDailySnapshot(event, pool);
  getOrCreatePoolHourlySnapshot(event, pool);
}

function updateRewardTokenEmissionsUSD(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  if (!pool.rewardTokens) {
    return;
  }
  const rewardTokenEmissionsUSD = new Array<BigDecimal>(
    pool.rewardTokens!.length
  );
  for (let i = 0; i < pool.rewardTokens!.length; i++) {
    const rewardToken = getOrCreateTokenFromString(pool.rewardTokens![i]);
    const emissionAmount = pool.rewardTokenEmissionsAmount![i];
    rewardTokenEmissionsUSD[i] = bigIntToBigDecimal(
      emissionAmount,
      rewardToken.decimals
    ).times(getPriceUSD(rewardToken, event));
  }
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
}

// isLPSwap will return true if any of the tokens on a given swap is an
// LP token from a metapool.
function isLPSwap(swap: SwapEvent, pool: LiquidityPool): boolean {
  if (!pool._basePool) {
    return false;
  }

  const basePool = LiquidityPool.load(pool._basePool!)!;
  return (
    basePool.outputToken == swap.tokenIn ||
    basePool.outputToken == swap.tokenOut
  );
}

function addTokenVolume(
  tokenVolume: BigInt[],
  swap: SwapEvent,
  pool: LiquidityPool
): BigInt[] {
  if (isLPSwap(swap, pool)) {
    return addLPSwapVolume(pool, swap, tokenVolume);
  }

  const tokenInIndex = pool.inputTokens.indexOf(swap.tokenIn);
  const tokenOutIndex = pool.inputTokens.indexOf(swap.tokenOut);
  tokenVolume[tokenInIndex] = tokenVolume[tokenInIndex].plus(swap.amountIn);
  tokenVolume[tokenOutIndex] = tokenVolume[tokenOutIndex].plus(swap.amountOut);
  return tokenVolume;
}

function addTokenVolumeUSD(
  tokenVolume: BigDecimal[],
  swap: SwapEvent,
  pool: LiquidityPool
): BigDecimal[] {
  if (isLPSwap(swap, pool)) {
    return addLPSwapVolumeUSD(pool, swap, tokenVolume);
  }

  const tokenInIndex = pool.inputTokens.indexOf(swap.tokenIn);
  const tokenOutIndex = pool.inputTokens.indexOf(swap.tokenOut);
  tokenVolume[tokenInIndex] = tokenVolume[tokenInIndex].plus(swap.amountInUSD);
  tokenVolume[tokenOutIndex] = tokenVolume[tokenOutIndex].plus(
    swap.amountOutUSD
  );
  return tokenVolume;
}

// addLPSwapVolume will add to a given volumes array the volume of each token
// involved in a swap. It will assume that one of the two tokens swapped is an LP token.
// Since we keep the underlying tokens that compose the LP instead of the LP token
// itself, we'll add the proportional part of each underlying from the LP volume.
function addLPSwapVolume(
  pool: LiquidityPool,
  swap: SwapEvent,
  poolVolumes: BigInt[]
): BigInt[] {
  const basePool = LiquidityPool.load(pool._basePool!)!;
  const lpToken = basePool.outputToken;

  let lpAmount = swap.amountIn;
  let nonLPAmount = swap.amountOut;
  let nonLPToken = swap.tokenOut;
  if (swap.tokenOut == lpToken) {
    lpAmount = swap.amountOut;
    nonLPAmount = swap.amountIn;
    nonLPToken = swap.tokenIn;
  }

  const multiplier = lpAmount.divDecimal(
    basePool.outputTokenSupply!.toBigDecimal()
  );
  const underlyingTokens = basePool.inputTokens;
  for (let i = 0; i < underlyingTokens.length; i++) {
    const token = underlyingTokens[i];
    const balance = basePool.inputTokenBalances[i].toBigDecimal();
    const tokenIndex = pool.inputTokens.indexOf(token);

    const vol = bigDecimalToBigInt(balance.times(multiplier));
    poolVolumes[tokenIndex] = poolVolumes[tokenIndex].plus(vol);
  }

  const index = pool.inputTokens.indexOf(nonLPToken);
  poolVolumes[index] = poolVolumes[index].plus(nonLPAmount);
  return poolVolumes;
}

// addLPSwapVolumeUSD will add to a given volumes array the volumeUSD of each token
// involved in a swap. It will assume that one of the two tokens swapped is an LP token.
// Since we keep the underlying tokens that compose the LP instead of the LP token 
// itself, we'll add the proportional part of each underlying from the LP volume.
function addLPSwapVolumeUSD(
  pool: LiquidityPool,
  swap: SwapEvent,
  poolVolumes: BigDecimal[]
): BigDecimal[] {
  const basePool = LiquidityPool.load(pool._basePool!)!;
  const lpToken = basePool.outputToken;

  let lpAmountUSD = swap.amountInUSD;
  let nonLPAmountUSD = swap.amountOutUSD;
  let nonLPToken = swap.tokenOut;
  if (swap.tokenOut == lpToken) {
    lpAmountUSD = swap.amountOutUSD;
    nonLPAmountUSD = swap.amountInUSD;
    nonLPToken = swap.tokenIn;
  }

  const underlyingTokens = basePool.inputTokens;
  for (let i = 0; i < underlyingTokens.length; i++) {
    const token = underlyingTokens[i];
    const index = pool.inputTokens.indexOf(token);
    const weight = basePool.inputTokenWeights[i].div(BIGDECIMAL_HUNDRED);

    const vol = lpAmountUSD.times(weight);
    poolVolumes[index] = poolVolumes[index].plus(vol);
  }

  const index = pool.inputTokens.indexOf(nonLPToken);
  poolVolumes[index] = poolVolumes[index].plus(nonLPAmountUSD);
  return poolVolumes;
}

function getBasePool(contract: Swap): string | null {
  const metaSwapStorageCall = contract.try_metaSwapStorage();
  if (metaSwapStorageCall.reverted) {
    return null;
  }
  return metaSwapStorageCall.value.value0 /* baseSwap */
    .toHexString();
}

function getOrCreateInputTokens(pooledTokens: Address[]): string[] {
  const tokens = pooledTokens.map<Token>((t) => getOrCreateToken(t));
  let tokenIds = tokens.map<string>((t) => t.id);
  const basePoolId = tokens[tokens.length - 1]._pool;
  if (basePoolId) {
    tokenIds.pop();
    const basePool = getOrCreatePool(Address.fromString(basePoolId));
    tokenIds = tokenIds.concat(basePool._inputTokensOrdered);
  }
  return tokenIds;
}

function updateOutputTokenPriceAndTVL(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  const totalValueLocked = getTokenAmountsSumUSD(
    event,
    pool.inputTokenBalances,
    pool.inputTokens
  );
  const outputTokenAmount = bigIntToBigDecimal(
    pool.outputTokenSupply!,
    getTokenDecimals(pool.outputToken!)
  );
  pool.outputTokenPriceUSD = totalValueLocked.equals(BIGDECIMAL_ZERO) ?
    BIGDECIMAL_ZERO : 
    totalValueLocked.div(outputTokenAmount); // avoid div by 0 when pool is empty
  updateProtocolTVL(event, totalValueLocked.minus(pool.totalValueLockedUSD));
  pool.totalValueLockedUSD = totalValueLocked;
}

function setInputTokenBalancesAndWeights(
  pool: LiquidityPool,
  contract: Swap | null = null
): void {
  if (contract == null) {
    contract = Swap.bind(Address.fromString(pool.id));
  }

  let bpBalances: BigInt[] = [];
  if (pool._basePool) {
    const basePool = getOrCreatePool(Address.fromString(pool._basePool!));
    setInputTokenBalancesAndWeights(basePool);

    const lpTokenIndex = pool.inputTokens.length - basePool.inputTokens.length;
    const lpTokenBalance = contract.getTokenBalance(lpTokenIndex);
    const totalLPTokenSupply = basePool.outputTokenSupply!;
    // Calculate pool input token amounts based on LP token ratio
    for (let i = 0; i < basePool.inputTokenBalances.length; i++) {
      const balance = basePool.inputTokenBalances[i];
      if (totalLPTokenSupply.equals(BIGINT_ZERO)) {
        bpBalances.push(BIGINT_ZERO);
        continue;
      }
      
      bpBalances.push(balance.times(lpTokenBalance).div(totalLPTokenSupply));
    }

    // since we want balances to be properly sorted we need them to all have the same
    // base reference. Balances fetched from the contract will follow the order of `_inputTokensSorted`.
    // BasePool balances are already sorted, but they need to match `_inputTokensOrdered` in order to sort
    // them together with the rest.
    bpBalances = sortValuesByTokenOrder(basePool.inputTokens, basePool._inputTokensOrdered, bpBalances);
  }

  const balances = getBalances(
    contract,
    pool.inputTokens.length - bpBalances.length,
  ).concat(bpBalances);

  pool.inputTokenBalances = sortValuesByTokenOrder(
    pool._inputTokensOrdered,
    pool.inputTokens,
    balances,
  );
  pool.inputTokenWeights = getBalanceWeights(
    pool.inputTokenBalances,
    pool.inputTokens
  );
}

function getBalances(contract: Swap, n: i32): BigInt[] {
  const balances: BigInt[] = new Array(n);
  for (let i = 0; i < n; i++) {
    balances[i] = contract.getTokenBalance(i);
  }
  return balances;
}

function getBalanceWeights(balances: BigInt[], tokens: string[]): BigDecimal[] {
  const decimalBalances: BigDecimal[] = new Array(balances.length);
  for (let i = 0; i < balances.length; i++) {
    decimalBalances[i] = bigIntToBigDecimal(
      balances[i],
      getTokenDecimals(tokens[i])
    );
  }
  let sum = decimalBalances.reduce((a, b) => a.plus(b), BIGDECIMAL_ZERO);
  if (sum == BIGDECIMAL_ZERO) {
    sum = BIGDECIMAL_ONE.times(new BigDecimal(BigInt.fromI32(balances.length)));
  }
  const weights: BigDecimal[] = new Array(balances.length);
  for (let i = 0; i < balances.length; i++) {
    weights[i] = decimalBalances[i].div(sum).times(BIGDECIMAL_HUNDRED);
  }
  return weights;
}

function fetchInputTokensFromContract(contract: Swap): Address[] {
  const tokens: Address[] = [];
  let i = 0;
  let call: ethereum.CallResult<Address>;
  do {
    call = contract.try_getToken(i);
    if (!call.reverted) {
      tokens.push(call.value);
    }
    i += 1;
  } while (!call.reverted);
  return tokens;
}

// sortValuesByTokenOrder will sort an array of values by performing the same
// order changes that need to be done to referenceOrder to get targetOrder.
export function sortValuesByTokenOrder<T>(
  referenceOrder: string[],
  targetOrder: string[],
  valuesToSort: Array<T>
): Array<T> {
  const len = referenceOrder.length;
  const intersection = arrayIntersection(referenceOrder, targetOrder);
  if (intersection.length != len || valuesToSort.length != len) {
    // reference and target should contain the same elements, just ordered differently.
    log.error(
      "Failed to sort array via reference. Both arrays should have the same values. Ref: {}, target: {}", 
      [referenceOrder.toString(), targetOrder.toString()]
    );
    log.critical("", []);
    return valuesToSort;
  }

  const ordered = new Array<T>(len);
  for (let i = 0; i < len; i++) {
    const val = valuesToSort[i];
    const ref = referenceOrder[i];

    const targetIndex = targetOrder.indexOf(ref)
    ordered[targetIndex] = val;
  }
  return ordered;
}

// arrayIntersection will return an array with the common items 
// between two arrays.
function arrayIntersection<T>(arr1: Array<T>, arr2: Array<T>): Array<T> {
  let len = arr1.length;
  let shorter = arr1;
  let longer = arr2;
  if (arr2.length < arr1.length) {
    len = arr2.length;
    longer = arr1;
    shorter = arr2;
  }

  const intersection = new Array<T>();
  for (let i = 0; i < len; i++) {
    const val = shorter[i];
    if (longer.indexOf(val) != -1) {
      intersection.push(val);
    }
  }
  return intersection;
}

function getOrCreateTokenPools(token: Address): _TokenPools {
  let pools = _TokenPools.load(token.toHexString());
  if (pools) {
    return pools;
  }

  pools = new _TokenPools(token.toHexString());
  pools.pools = [];
  pools.save();
  return pools;
}

// registerPoolForTokens will keep track of the pool entity on an auxiliary entity
// that is indexed by token address (so we can easily tell in which pools a token is traded).
function registerPoolForTokens(pool: LiquidityPool): void {
  for (let i = 0; i < pool.inputTokens.length; i++) {
    const token = pool.inputTokens[i];
    const pools = getOrCreateTokenPools(Address.fromString(token));
    if (pools.pools.includes(pool.id)) {
      continue;
    }
    pools.pools = pools.pools.concat([pool.id]);
    pools.save();
  }
}

// Saddle finance might have wrongly added LP tokens to their minichef
// rewards contract. The contract works by adding the address of the LP
// token to reward a given pool. But they added the address of the pool
// by mistake instead of the LP on Optimism. This function will tell if a given
// supposedly LP address is really a Pool.
function isBrokenMinichefPool(lpToken: Address): bool {
  const broken = ["0xc55e8c79e5a6c3216d4023769559d06fa9a7732e"];
  return broken.includes(lpToken.toHexString());
}