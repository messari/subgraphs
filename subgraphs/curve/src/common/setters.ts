import { Address, ethereum, BigInt, log, BigDecimal } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/templates/CurvePoolTemplate/ERC20";
import { LiquidityPool, Registry } from "../../generated/schema"
import { CurvePoolCoin128 } from "../../generated/templates/CryptoFactoryTemplate/CurvePoolCoin128";
import { CurvePool } from "../../generated/templates/CryptoFactoryTemplate/CurvePool";
import { ASSET_TYPES, CURVE_ADMIN_FEE, CURVE_POOL_FEE, CURVE_REGISTRY, LENDING, LENDING_POOLS } from "./constants/index";
import { getOrCreateDexAmm, getOrCreateToken, getPoolFee } from "./getters";
import { bigIntToBigDecimal } from "./utils/numbers";
import { BIGDECIMAL_ONE_HUNDRED, BIGDECIMAL_ZERO,BIGINT_ZERO, FEE_DENOMINATOR_DECIMALS, LiquidityPoolFeeType } from "./constants";
import { MainRegistry } from "../../generated/AddressProvider/MainRegistry";
import { getCryptoTokenPrice, getPoolAssetPrice } from "../services/snapshots";
import { getPlatform } from "../services/platform";
import { CurvePoolV2 } from "../../generated/AddressProvider/CurvePoolV2";

export function setPoolCoins128(pool: LiquidityPool): void {
    const curvePool = CurvePoolCoin128.bind(Address.fromString(pool.id))
    let i = 0
    const inputTokens = pool.inputTokens
    let coinResult = curvePool.try_coins(BigInt.fromI32(i))
    if (coinResult.reverted) {
      log.warning('Call to int128 coins failed for {} ({})', [pool.name!, pool.id])
    }
    while (!coinResult.reverted) {
      inputTokens.push(getOrCreateToken(coinResult.value).id);
      i += 1;
      coinResult = curvePool.try_coins(BigInt.fromI32(i));
    }
    pool.inputTokens = inputTokens
    pool.save()
}

export function setPoolCoins(pool: LiquidityPool): void {
    const curvePool = CurvePool.bind(Address.fromString(pool.id))
    let i = 0
    const inputTokens = pool.inputTokens
    let coinResult = curvePool.try_coins(BigInt.fromI32(i))
    if (coinResult.reverted) {
      // some pools require an int128 for coins and will revert with the
      // regular abi. e.g. 0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714
      log.warning('Call to coins reverted for pool ({}: {}), attempting 128 bytes call', [pool.name!, pool.id])
      setPoolCoins128(pool)
      return 
    }
    while (!coinResult.reverted) {
      inputTokens.push(getOrCreateToken(coinResult.value).id)
      i += 1
      coinResult = curvePool.try_coins(BigInt.fromI32(i))
    }
    pool.inputTokens = inputTokens
    pool.save()
}
  
export function setPoolBalances(pool:LiquidityPool): void {
    let poolContract = CurvePool.bind(Address.fromString(pool.id));
    let inputTokens = pool.inputTokens;
    let inputTokensBalances: BigInt[] = [];
    let balanceCall = poolContract.try_balances(BigInt.fromI32(0));
    if (balanceCall.reverted) {
      for (let i = 0; i < inputTokens.length; ++i) {
        let token = inputTokens[i];

        let balanceCall = ERC20.bind(Address.fromString(token)).try_balanceOf(Address.fromString(pool.id));
        if (!balanceCall.reverted) {
            inputTokensBalances.push(balanceCall.value);
        } 
      }
    } else {
      for (let i = 0; i < inputTokens.length; ++i) {
        balanceCall = poolContract.try_balances(BigInt.fromI32(i));
        if (!balanceCall.reverted){
          inputTokensBalances.push(balanceCall.value);
        }
      }
      pool.inputTokenBalances = inputTokensBalances;
      pool.save();
      return
    }
    pool.inputTokenBalances = inputTokensBalances;
    pool.save();
    return
}

export function setPoolTokenWeights(liquidityPool:LiquidityPool): void {
    let sum = BIGDECIMAL_ZERO;
    let inputTokens = liquidityPool.inputTokens;
    let inputTokenBalances = liquidityPool.inputTokenBalances;
    let inputTokensBalancesDecimalized: BigDecimal[] = [];
    let balanceDecimalized = BIGDECIMAL_ZERO;
    for (let i = 0; i < inputTokenBalances.length; ++i) {
      balanceDecimalized = bigIntToBigDecimal(inputTokenBalances[i], getOrCreateToken(Address.fromString(inputTokens[i])).decimals)
      inputTokensBalancesDecimalized.push(balanceDecimalized)
      sum = sum.plus(balanceDecimalized);
    }
    let inputTokenWeights: BigDecimal[] = [];
    for (let i = 0; i < inputTokenBalances.length; ++i) {
      if (sum.gt(BIGDECIMAL_ZERO)) {
        inputTokenWeights.push(inputTokensBalancesDecimalized[i].div(sum));
      } else{
        inputTokenWeights.push(BIGDECIMAL_ZERO);
      }
    }
    liquidityPool.inputTokenWeights = inputTokenWeights;
    liquidityPool.save();
}

export function setPoolFeesV2(pool:LiquidityPool): void {
  let curvePool = CurvePoolV2.bind(Address.fromString(pool.id));
  let totalFeeCall = curvePool.try_fee();
  let adminFeeCall = curvePool.try_admin_fee();
  let totalFee = totalFeeCall.reverted ? CURVE_POOL_FEE : bigIntToBigDecimal(totalFeeCall.value, FEE_DENOMINATOR_DECIMALS); // format to percentage
  let adminFee = adminFeeCall.reverted ? CURVE_ADMIN_FEE : bigIntToBigDecimal(adminFeeCall.value, FEE_DENOMINATOR_DECIMALS); // format to percentage

  let tradingFee = getPoolFee(pool.id,LiquidityPoolFeeType.DYNAMIC_TRADING_FEE); // v2 pools have dynamic trading fees
  tradingFee.feePercentage = totalFee.times(BIGDECIMAL_ONE_HUNDRED);
  tradingFee.save();

  let protocolFee = getPoolFee(pool.id,LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE);
  protocolFee.feePercentage = adminFee.times(totalFee).times(BIGDECIMAL_ONE_HUNDRED);
  protocolFee.save();

  let lpFee = getPoolFee(pool.id,LiquidityPoolFeeType.DYNAMIC_LP_FEE);
  lpFee.feePercentage = totalFee.minus((adminFee.times(totalFee))).times(BIGDECIMAL_ONE_HUNDRED);
  lpFee.save();
}

export function setPoolFees(pool: LiquidityPool): void {
    let curvePool = CurvePool.bind(Address.fromString(pool.id));
    if (pool.isV2) {
      setPoolFeesV2(pool)
      return 
    }
    let totalFeeCall = curvePool.try_fee();
    let adminFeeCall = curvePool.try_admin_fee();
    let totalFee = totalFeeCall.reverted ? CURVE_POOL_FEE : bigIntToBigDecimal(totalFeeCall.value, FEE_DENOMINATOR_DECIMALS); // format to percentage
    let adminFee = adminFeeCall.reverted ? CURVE_ADMIN_FEE : bigIntToBigDecimal(adminFeeCall.value, FEE_DENOMINATOR_DECIMALS); // format to percentage
    
    let tradingFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_TRADING_FEE);
    tradingFee.feePercentage = totalFee.times(BIGDECIMAL_ONE_HUNDRED);
    tradingFee.save();
  
    let protocolFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_PROTOCOL_FEE);
    protocolFee.feePercentage = adminFee.times(totalFee).times(BIGDECIMAL_ONE_HUNDRED);
    protocolFee.save();
  
    let lpFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_LP_FEE);
    lpFee.feePercentage = totalFee.minus((adminFee.times(totalFee))).times(BIGDECIMAL_ONE_HUNDRED);
    lpFee.save();

    pool.fees = [tradingFee.id, protocolFee.id, lpFee.id];  
    pool.save();
  }

export function setPoolOutputTokenSupply(pool: LiquidityPool): void {
  let outputTokenSupply = ERC20.bind(Address.fromString(pool.outputToken!)).try_totalSupply()
  if (outputTokenSupply.reverted) {
    log.warning('Call to totalSupply failed for pool = {} , lptoken = ({})', [pool.id, pool.outputToken!])
    return
  }
  pool.outputTokenSupply = outputTokenSupply.value;
  pool.save();
}

export function setPoolTVL(pool: LiquidityPool, timestamp: BigInt): BigDecimal {
  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  for (let j = 0; j < pool.inputTokens.length; j++) {
    let balance = pool.inputTokenBalances[j];
    let token = getOrCreateToken(Address.fromString(pool.inputTokens[j]))
    const priceUSD = pool.isV2 ? getCryptoTokenPrice(Address.fromString(token.id), timestamp, pool) : getPoolAssetPrice(pool,timestamp)
    totalValueLockedUSD = totalValueLockedUSD.plus(bigIntToBigDecimal(balance, token.decimals).times(priceUSD))    
  }
  pool.totalValueLockedUSD = totalValueLockedUSD;
  pool.save();
  return totalValueLockedUSD;
}

export function setProtocolTVL(): void {
  // updates all pool TVLs along with protocol TVL
  let protocol = getOrCreateDexAmm();
  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  const platform = getPlatform();
  for (let i = 0; i < platform.poolAddresses.length; ++i) {
    const poolAddress = platform.poolAddresses[i]
    const pool = LiquidityPool.load(poolAddress)
    if (!pool) {
      return
    }
    totalValueLockedUSD = totalValueLockedUSD.plus(pool.totalValueLockedUSD)
  }
  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.save();
}
