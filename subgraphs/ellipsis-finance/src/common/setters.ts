import { Address, BigInt, log, BigDecimal } from "@graphprotocol/graph-ts";
import { LiquidityPool, LptokenPool } from "../../generated/schema";
import { getOrCreateDexAmm, getOrCreateToken, getPoolFee } from "./getters";
import { bigIntToBigDecimal } from "./utils/numbers";
import {
  ADMIN_FEE,
  BIGDECIMAL_ONE_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  FEE_DENOMINATOR_DECIMALS,
  LiquidityPoolFeeType,
  POOL_FEE,
} from "./constants";
import { getPoolAssetPrice } from "../services/snapshots";
import { getPlatform } from "../services/platform";
import { ERC20 } from "../../generated/Factory/ERC20";
import { StableSwap } from "../../generated/Factory/StableSwap";


function initBalancesList(pool: LiquidityPool): BigInt[] {
  let inputTokensBalances: BigInt[] = [];
  for (let i = 0; i < pool.inputTokens.length; i++) {
    inputTokensBalances.push(BIGINT_ZERO)
  }
  return inputTokensBalances;
}

export function setPoolBalances(pool: LiquidityPool): void {
  let poolContract = StableSwap.bind(Address.fromString(pool.id));
  let inputTokensBalances = initBalancesList(pool);
  let balanceCall = poolContract.try_balances(BigInt.fromI32(0));
  if (balanceCall.reverted) {
    for (let i = 0; i < pool.inputTokens.length; ++i) {
      let token = pool.inputTokens[i];
      let balanceCall = ERC20.bind(Address.fromString(token)).try_balanceOf(Address.fromString(pool.id));
      if (!balanceCall.reverted) {
        inputTokensBalances.push(balanceCall.value);
      }
    }
  } else {
    let coins = pool.coins;
    for (let i = 0; i < coins.length; ++i) {
      let coin = coins[i];
      let inputTokenIndex = pool.inputTokens.indexOf(coin);
      balanceCall = poolContract.try_balances(BigInt.fromI32(i));
      if (!balanceCall.reverted) {
        inputTokensBalances[inputTokenIndex] = balanceCall.value;
      }
    }
    pool.inputTokenBalances = inputTokensBalances;
    pool.save();
    return;
  }
  pool.inputTokenBalances = inputTokensBalances;
  pool.save();
  return;
}

export function setPoolFeesV2(pool: LiquidityPool): void {
  let curvePool = StableSwap.bind(Address.fromString(pool.id));
  let totalFeeCall = curvePool.try_fee();
  let adminFeeCall = curvePool.try_admin_fee();
  let totalFee = totalFeeCall.reverted ? POOL_FEE : bigIntToBigDecimal(totalFeeCall.value, FEE_DENOMINATOR_DECIMALS); // format to percentage
  let adminFee = adminFeeCall.reverted ? ADMIN_FEE : bigIntToBigDecimal(adminFeeCall.value, FEE_DENOMINATOR_DECIMALS); // format to percentage

  let tradingFee = getPoolFee(pool.id, LiquidityPoolFeeType.DYNAMIC_TRADING_FEE); // v2 pools have dynamic trading fees
  tradingFee.feePercentage = totalFee.times(BIGDECIMAL_ONE_HUNDRED);
  tradingFee.save();

  let protocolFee = getPoolFee(pool.id, LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE);
  protocolFee.feePercentage = adminFee.times(totalFee).times(BIGDECIMAL_ONE_HUNDRED);
  protocolFee.save();

  let lpFee = getPoolFee(pool.id, LiquidityPoolFeeType.DYNAMIC_LP_FEE);
  lpFee.feePercentage = totalFee.minus(adminFee.times(totalFee)).times(BIGDECIMAL_ONE_HUNDRED);
  lpFee.save();

  pool.fees = [tradingFee.id, protocolFee.id, lpFee.id];
  pool.save();
}

export function setPoolFees(pool: LiquidityPool): void {
  let curvePool = StableSwap.bind(Address.fromString(pool.id));
  if (pool.isV2) {
    setPoolFeesV2(pool);
    return;
  }
  let totalFeeCall = curvePool.try_fee();
  let adminFeeCall = curvePool.try_admin_fee();
  let totalFee = totalFeeCall.reverted ? POOL_FEE : bigIntToBigDecimal(totalFeeCall.value, FEE_DENOMINATOR_DECIMALS); // format to percentage
  let adminFee = adminFeeCall.reverted ? ADMIN_FEE : bigIntToBigDecimal(adminFeeCall.value, FEE_DENOMINATOR_DECIMALS); // format to percentage
  let tradingFee = getPoolFee(pool.id, LiquidityPoolFeeType.FIXED_TRADING_FEE);
  tradingFee.feePercentage = totalFee.times(BIGDECIMAL_ONE_HUNDRED);
  tradingFee.save();

  let protocolFee = getPoolFee(pool.id, LiquidityPoolFeeType.FIXED_PROTOCOL_FEE);
  protocolFee.feePercentage = adminFee.times(totalFee).times(BIGDECIMAL_ONE_HUNDRED);
  protocolFee.save();

  let lpFee = getPoolFee(pool.id, LiquidityPoolFeeType.FIXED_LP_FEE);
  lpFee.feePercentage = totalFee.minus(adminFee.times(totalFee)).times(BIGDECIMAL_ONE_HUNDRED);
  lpFee.save();

  pool.fees = [tradingFee.id, protocolFee.id, lpFee.id];
  pool.save();
}

export function setPoolOutputTokenSupply(pool: LiquidityPool): void {
  let outputTokenSupply = ERC20.bind(Address.fromString(pool.outputToken)).try_totalSupply();
  if (outputTokenSupply.reverted) {
    log.warning("Call to totalSupply failed for pool = {} , lptoken = ({})", [pool.id, pool.outputToken]);
    return;
  }
  pool.outputTokenSupply = outputTokenSupply.value;
  pool.save();
}

export function setPoolTokenWeights(liquidityPool: LiquidityPool, timestamp: BigInt): void {
  // only calculate AFTER TVL has been set/updated
  let inputTokenWeights: BigDecimal[] = [];
  for (let j = 0; j < liquidityPool.inputTokens.length; j++) {
    if (liquidityPool.totalValueLockedUSD == BIGDECIMAL_ZERO) {
      inputTokenWeights.push(BIGDECIMAL_ZERO);
    } else {
      let balance = liquidityPool.inputTokenBalances[j];
      let token = getOrCreateToken(Address.fromString(liquidityPool.inputTokens[j]));
      const priceUSD = getPoolAssetPrice(liquidityPool, timestamp);
      const balanceUSD = bigIntToBigDecimal(balance, token.decimals).times(priceUSD);
      const weight =
        liquidityPool.totalValueLockedUSD == BIGDECIMAL_ZERO
          ? BIGDECIMAL_ZERO
          : balanceUSD.div(liquidityPool.totalValueLockedUSD);
      inputTokenWeights.push(weight);
    }
  }
  liquidityPool.inputTokenWeights = inputTokenWeights;
  liquidityPool.save();
}

export function setPoolTVL(pool: LiquidityPool, timestamp: BigInt): BigDecimal {
  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  const priceUSD = getPoolAssetPrice(pool, timestamp);
  for (let j = 0; j < pool.inputTokens.length; j++) {
    let balance = pool.inputTokenBalances[j];
    let token = getOrCreateToken(Address.fromString(pool.inputTokens[j]));
    totalValueLockedUSD = totalValueLockedUSD.plus(bigIntToBigDecimal(balance, token.decimals).times(priceUSD));
  }
  pool.totalValueLockedUSD = totalValueLockedUSD;
  pool.save();
  setPoolTokenWeights(pool, timestamp); // reweight pool every time TVL changes
  return totalValueLockedUSD;
}

export function setProtocolTVL(): void {
  // updates all pool TVLs along with protocol TVL
  let protocol = getOrCreateDexAmm();
  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  const platform = getPlatform();
  for (let i = 0; i < platform.poolAddresses.length; ++i) {
    const poolAddress = platform.poolAddresses[i];
    const pool = LiquidityPool.load(poolAddress);
    if (!pool) {
      return;
    }
    totalValueLockedUSD = totalValueLockedUSD.plus(pool.totalValueLockedUSD);
  }
  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}

export function setLpTokenPool(lpToken: Address, pool: Address): void {
  let lpTokenPool = new LptokenPool(lpToken.toHexString());
  lpTokenPool.pool = pool.toHexString();
  lpTokenPool.save();
}