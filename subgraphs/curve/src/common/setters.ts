import { Address, ethereum, BigInt, log, BigDecimal } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/MainRegistry/ERC20";
import { MainRegistry } from "../../generated/MainRegistry/MainRegistry";
import { LiquidityPool, LiquidityPoolFee } from "../../generated/schema"
import { CurvePoolCoin128 } from "../../generated/templates/Pool/CurvePoolCoin128";
import { CurvePoolCoin256 } from "../../generated/templates/Pool/CurvePoolCoin256";
import { StableSwap } from "../../generated/templates/Pool/StableSwap";
import { ASSET_TYPES, BIGDECIMAL_ZERO, CURVE_ADMIN_FEE, CURVE_POOL_FEE, LiquidityPoolFeeType, POOL_LP_TOKEN_MAP } from "./constants";
import { getOrCreateToken, getTokenPrice } from "./getters";
import { bigIntToBigDecimal, exponentToBigInt } from "./utils/numbers";
import { getUsdPrice } from "../prices";


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
    log.warning('Pool coins call = {}, {}',[pool.name,coinResult.reverted.toString()])
    log.warning('Call to coins 256 reverted for pool ({}: {}), attempting 128 bytes call', [pool.name, pool.id])
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
    log.warning("assetType pool = {}", [pool.id]);
    let registryContract = MainRegistry.bind(registryAddress);
    let assetTypeCall = registryContract.try_get_pool_asset_type(Address.fromString(pool.id));
    if (!assetTypeCall.reverted) {
      log.warning("assetType pool = {}, type = {}", [pool.id, assetTypeCall.value.toString()]);
      pool.assetType = assetTypeCall.value.toI32();
      return
    }
    pool.assetType = ASSET_TYPES!.get(pool.id.toLowerCase())!;
    pool.save();
    return
}
  
  export function setPoolLPToken(pool:LiquidityPool, registryAddress: Address): void {
    log.warning("set lp token for pool = {}", [pool.id]);
    let registryContract = MainRegistry.bind(registryAddress);
    let lpTokenCall = registryContract.try_get_lp_token(Address.fromString(pool.id));
    log.warning("set lp token call = {}", [lpTokenCall.reverted.toString()]);
    if (!lpTokenCall.reverted) {
      let lpToken = getOrCreateToken(lpTokenCall.value)
      pool.outputToken = lpToken.id;
      pool.outputTokenSupply = ERC20.bind(Address.fromString(lpToken.id)).totalSupply();
      pool.save();
      return
    }
    let outputToken = POOL_LP_TOKEN_MAP.get(pool.id.toLowerCase())!;
    if (!outputToken) {
      log.warning("Pool {} has no output token", [pool.id]);
      return
    }
    let lpToken = getOrCreateToken(Address.fromString(outputToken));
    pool.outputToken = lpToken.id;
    pool.outputTokenSupply = ERC20.bind(Address.fromString(lpToken.id)).totalSupply();
    log.warning("lp token call successful",[])
    pool.save();
    return
}
  
export function setPoolTokenWeights(liquidityPool:LiquidityPool): void {
  log.warning('pool token weight call',[])
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
    log.warning('pool token weight call successful',[])
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
    log.warning("setPoolBalances call for = {}", [pool.id]);
    let poolContract = StableSwap.bind(Address.fromString(pool.id));
    let inputTokens = pool.inputTokens;
    let inputTokensBalances: BigInt[] = [];
    let balanceCall = poolContract.try_balances(BigInt.fromI32(0));
    log.warning("balance call reverted ? = {}", [balanceCall.reverted.toString()]);
    log.warning("input tokens length = {}", [inputTokens.length.toString()]);

    if (balanceCall.reverted) {
      for (let i = 0; i < inputTokens.length; ++i) {
        let balance = ERC20.bind(Address.fromString(inputTokens[i])).balanceOf(Address.fromString(pool.id));
        log.warning("erc20 balance call ? = {}", [balance.toString()]);
        inputTokensBalances.push(balance);
      }
    } else {
      log.warning("balance call val = {}", [balanceCall.value.toString()]);
      for (let i = 0; i < inputTokens.length; ++i) {
        log.warning("token # = {}", [i.toString()]);
        balanceCall = poolContract.try_balances(BigInt.fromI32(i));
        if (!balanceCall.reverted){
          log.warning("token # = {}, {}", [i.toString(), balanceCall.value.toString()]);
          inputTokensBalances.push(balanceCall.value);
        }
      }
      pool.inputTokenBalances = inputTokensBalances;
      pool.save();
      log.warning("balance successful", []);
      return
    }

    /*
    let poolContractV1 = CurvePoolV1.bind(Address.fromString(pool.id));
    for (let i = 0; i < inputTokens.length; ++i) {
        log.debug("balance call for token = {}", [i.toString()]);
        let balance = poolContractV1.try_balances(BigInt.fromI32(i));
        if (!balance.reverted) {
          inputTokensBalances.push(balance.value);
          log.debug("balance = {}", [balance.value.toString()]);
        }
    }
    */
    pool.inputTokenBalances = inputTokensBalances;
    pool.save();
    return
}

export function setPoolFees(pool: LiquidityPool, registryAddress:Address, event: ethereum.Event): void {
    log.warning('set fees',[])
    let stableSwap = StableSwap.bind(Address.fromString(pool.id));
    let registryContract = MainRegistry.bind(registryAddress);
    let feesCall = registryContract.try_get_fees(Address.fromString(pool.id));
    let totalFee = BIGDECIMAL_ZERO;
    let adminFee = BIGDECIMAL_ZERO;
    if (!feesCall.reverted) {
      totalFee = bigIntToBigDecimal(feesCall.value[0], 10);
      adminFee = bigIntToBigDecimal(feesCall.value[1], 10);
    } else {
      let totalFeeCall = stableSwap.try_fee();
      let adminFeeCall = stableSwap.try_admin_fee();
      totalFee = totalFeeCall.reverted ? CURVE_POOL_FEE : bigIntToBigDecimal(totalFeeCall.value, 10);
      adminFee = adminFeeCall.reverted ? CURVE_ADMIN_FEE : bigIntToBigDecimal(adminFeeCall.value, 10);
    }
    let tradingFee = new LiquidityPoolFee(LiquidityPoolFeeType.FIXED_TRADING_FEE + "-" + pool.id);
    tradingFee.feePercentage = totalFee;
    tradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
    tradingFee.save();
  
    let protocolFee = new LiquidityPoolFee(LiquidityPoolFeeType.FIXED_PROTOCOL_FEE + "-" + pool.id);
    protocolFee.feePercentage = adminFee.times(totalFee);
    protocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
    protocolFee.save();
  
    let lpFee = new LiquidityPoolFee(LiquidityPoolFeeType.FIXED_LP_FEE + "-" + pool.id);
    lpFee.feePercentage = totalFee.minus(adminFee.times(totalFee));
    lpFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
    lpFee.save();
    pool.fees = [tradingFee.id, protocolFee.id, lpFee.id];
  
    pool.createdBlockNumber = event.block.number;
    pool.createdTimestamp = event.block.timestamp;
  
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    pool.save();
  }


export function setTokenPrices(pool:LiquidityPool, event: ethereum.Event): void {
  for (let i = 0; i < pool.inputTokens.length; ++i) {
    getTokenPrice(Address.fromString(pool.inputTokens[i]),event);
  }
  getTokenPrice(Address.fromString(pool.outputToken),event);
}