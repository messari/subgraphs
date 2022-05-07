import { Address, ethereum, BigInt, log, BigDecimal } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/MainRegistry/ERC20";
import { MainRegistry } from "../../generated/MainRegistry/MainRegistry";
import { LiquidityPool } from "../../generated/schema"
import { CurvePoolCoin128 } from "../../generated/templates/Pool/CurvePoolCoin128";
import { CurvePoolCoin256 } from "../../generated/templates/Pool/CurvePoolCoin256";
import { StableSwap } from "../../generated/templates/Pool/StableSwap";
import { ASSET_TYPES, BIGDECIMAL_ZERO, BIGINT_ZERO, CURVE_ADMIN_FEE, CURVE_POOL_FEE, LENDING, LENDING_POOLS, LiquidityPoolFeeType, POOL_LP_TOKEN_MAP } from "./constants";
import { getOrCreateToken, getPoolFee, getTokenPrice } from "./getters";
import { bigIntToBigDecimal } from "./utils/numbers";
import * as utils from "../prices/common/utils";

export function setPoolCoins128(pool: LiquidityPool): void {
    const curvePool = CurvePoolCoin128.bind(Address.fromString(pool.id))
    let i = 0
    const inputTokens = pool.inputTokens
    let coinResult = curvePool.try_coins(BigInt.fromI32(i))
    if (coinResult.reverted) {
      log.warning('Call to int128 coins failed for {} ({})', [pool.name, pool.id])
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
    const curvePool = CurvePoolCoin256.bind(Address.fromString(pool.id))
    let i = 0
    const inputTokens = pool.inputTokens
    let coinResult = curvePool.try_coins(BigInt.fromI32(i))
    if (coinResult.reverted) {
      // some pools require an int128 for coins and will revert with the
      // regular abi. e.g. 0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714
      log.warning('Call to coins reverted for pool ({}: {}), attempting 128 bytes call', [pool.name, pool.id])
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

export function setPoolUnderlyingCoins(pool: LiquidityPool): void {
  const curvePool = CurvePoolCoin256.bind(Address.fromString(pool.id))
  let i = 0
  const inputTokens = pool.inputTokens
  let coinResult = curvePool.try_coins(BigInt.fromI32(i))
  if (coinResult.reverted) {
    // some pools require an int128 for coins and will revert with the
    // regular abi. e.g. 0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714
    log.warning('Call to coins reverted for pool ({}: {}), attempting 128 bytes call', [pool.name, pool.id])
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

export function setPoolAssetType(pool: LiquidityPool, registryAddress: Address): void {
    let registryContract = MainRegistry.bind(registryAddress);
    let assetTypeCall = registryContract.try_get_pool_asset_type(Address.fromString(pool.id));
    if (!assetTypeCall.reverted) {
      pool.assetType = assetTypeCall.value.toI32();
      pool.save();
      return
    }
    pool.assetType = ASSET_TYPES!.get(pool.id.toLowerCase())!;
    pool.save();
    return
}
  
  export function setPoolLPToken(pool:LiquidityPool, registryAddress: Address): void {
    let registryContract = MainRegistry.bind(registryAddress);
    let lpTokenCall = registryContract.try_get_lp_token(Address.fromString(pool.id));
    if (!lpTokenCall.reverted) {
      let lpToken = getOrCreateToken(lpTokenCall.value)
      pool.outputToken = lpToken.id;
      let outputTokenSupply: BigInt = utils.readValue<BigInt>(ERC20.bind(Address.fromString(lpToken.id)).try_totalSupply(), BIGINT_ZERO);
      pool.outputTokenSupply = outputTokenSupply;
      pool.save();
      return
    }
    let outputToken = POOL_LP_TOKEN_MAP.get(pool.id.toLowerCase())!;
    if (!outputToken) {
      return
    }
    let lpToken = getOrCreateToken(Address.fromString(outputToken));
    pool.outputToken = lpToken.id;
    let outputTokenSupply: BigInt = utils.readValue<BigInt>(ERC20.bind(Address.fromString(lpToken.id)).try_totalSupply(), BIGINT_ZERO);
    pool.outputTokenSupply = outputTokenSupply;
    pool.save();
    return
}
  
export function setPoolTokenWeights(liquidityPool:LiquidityPool): void {
    let sum = BIGDECIMAL_ZERO;
    let inputTokens = liquidityPool.inputTokens;
    let inputTokenBalances = liquidityPool.inputTokenBalances;
    let inputTokensBalancesDecimalized = new Array<BigDecimal>();
    let balanceDecimalized = BIGDECIMAL_ZERO;
    for (let i = 0; i < inputTokenBalances.length; ++i) {
      balanceDecimalized = bigIntToBigDecimal(inputTokenBalances[i], getOrCreateToken(Address.fromString(inputTokens[i])).decimals)
      inputTokensBalancesDecimalized.push(balanceDecimalized)
      sum = sum.plus(balanceDecimalized);
    }
    let inputTokenWeights = liquidityPool.inputTokenWeights;
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
  
export function setPoolName(pool:LiquidityPool, registryAddress: Address): void {
    let registryContract = MainRegistry.bind(registryAddress);
    let nameCall = registryContract.try_get_pool_name(Address.fromString(pool.id));
    if (!nameCall.reverted) {
      pool.name = nameCall.value;
      pool.save();
      return
    }
    pool.name = getOrCreateToken(Address.fromString(pool.outputToken)).name;
    pool.save();
    return
}

export function setPoolBalances(pool:LiquidityPool): void {
    let poolContract = StableSwap.bind(Address.fromString(pool.id));
    let inputTokens = pool.inputTokens;
    let inputTokensBalances: BigInt[] = [];
    let balanceCall = poolContract.try_balances(BigInt.fromI32(0));

    if (balanceCall.reverted) {
      for (let i = 0; i < inputTokens.length; ++i) {
        let balance: BigInt = utils.readValue<BigInt>(ERC20.bind(Address.fromString(inputTokens[i])).try_balanceOf(Address.fromString(pool.id)), BIGINT_ZERO);
        inputTokensBalances.push(balance);
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

export function setPoolFees(pool: LiquidityPool, registryAddress:Address, event: ethereum.Event): void {
    let stableSwap = StableSwap.bind(Address.fromString(pool.id));
    let registryContract = MainRegistry.bind(registryAddress);
    let feesCall = registryContract.try_get_fees(Address.fromString(pool.id));
    let totalFee = BIGDECIMAL_ZERO;
    let adminFee = BIGDECIMAL_ZERO;
    if (!feesCall.reverted) {
      totalFee = bigIntToBigDecimal(feesCall.value[0], 8); // divide by 10^8 to get fee rate in % terms
      adminFee = bigIntToBigDecimal(feesCall.value[1], 8);
    } else {
      let totalFeeCall = stableSwap.try_fee();
      let adminFeeCall = stableSwap.try_admin_fee();
      totalFee = totalFeeCall.reverted ? CURVE_POOL_FEE : bigIntToBigDecimal(totalFeeCall.value, 8);
      adminFee = adminFeeCall.reverted ? CURVE_ADMIN_FEE : bigIntToBigDecimal(adminFeeCall.value, 8);
    }
    let tradingFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_TRADING_FEE);
    tradingFee.feePercentage = totalFee;
    tradingFee.save();
  
    let protocolFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_PROTOCOL_FEE);
    protocolFee.feePercentage = adminFee.times(totalFee);
    protocolFee.save();
  
    let lpFee = getPoolFee(pool.id,LiquidityPoolFeeType.FIXED_LP_FEE);
    lpFee.feePercentage = totalFee.minus((adminFee.times(totalFee)));
    lpFee.save();

    pool.fees = [tradingFee.id, protocolFee.id, lpFee.id];  
    pool.save();
  }

export function setPoolType(pool:LiquidityPool, registryAddress: Address): void {
  if (LENDING_POOLS.includes(Address.fromString(pool.id))) {
    pool.poolType = LENDING;
  }
  
}
