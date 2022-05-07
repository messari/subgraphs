import { Address, dataSource, ethereum, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { MainRegistry, PoolAdded } from "../../generated/MainRegistry/MainRegistry";
import { LiquidityPool, LiquidityPoolFee } from "../../generated/schema";
import { StableSwap } from "../../generated/templates/Pool/StableSwap";
import { getOrCreateDexAmm, getOrCreateToken, getPoolTVL, getTokenPrice } from "../common/getters";
import { ERC20 } from "../../generated/MainRegistry/ERC20";
import { bigIntToBigDecimal, divBigDecimal } from "../common/utils/numbers";
import {
  ASSET_TYPES,
  BIGDECIMAL_HUNDRED,
  BIGINT_CRV_LP_TOKEN_DECIMALS,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  LiquidityPoolFeeType,
  POOL_LP_TOKEN_MAP,
} from "../common/constants";
import { BIGDECIMAL_ZERO, BIGINT_TEN } from "../prices/common/constants";
//import { getTokenPriceForAssetType } from "../prices";
//import { getLpTokenPriceUSD } from "../prices/curve/lppricing";
import { setPoolAssetType, setPoolBalances, setPoolCoins, setPoolFees, setPoolLPToken, setPoolName, setPoolTokenWeights } from "../common/setters";


export function getOrCreatePool(address: Address, registryAddress: Address, event: ethereum.Event): LiquidityPool {
  let liquidityPool = LiquidityPool.load(address.toHexString());
  log.debug("tx = {}", [event.transaction.hash.toHexString()]);
  if (!liquidityPool) {
    liquidityPool = new LiquidityPool(address.toHexString());
    liquidityPool.protocol = getOrCreateDexAmm().id;
    setPoolCoins(liquidityPool); // saves coins to liquidity input tokens list
    setPoolBalances(liquidityPool); // set input token balances
    setPoolLPToken(liquidityPool, registryAddress); // saves lpToken to liquidity output token
    setPoolTokenWeights(liquidityPool);
    setPoolName(liquidityPool, registryAddress);
    setPoolAssetType(liquidityPool, registryAddress);
    liquidityPool.outputTokenPriceUSD = getTokenPrice(Address.fromString(liquidityPool.outputToken),event); // set lptoken price
    liquidityPool.totalValueLockedUSD = getPoolTVL(liquidityPool, event); // tvl usd
    // "0xeb4c2781e4eba804ce9a9803c67d0893436bb27d", "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", "0x1be5d71f2da660bfdee8012ddc58d024448a0a59", "0x04bc0ab673d88ae9dbc9da2380cb6b79c4bca9ae"

    setPoolFees(liquidityPool, registryAddress, event);     // handle fees

    liquidityPool.rewardTokens = [];
    liquidityPool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    liquidityPool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];
    liquidityPool.stakedOutputTokenAmount = BIGINT_ZERO;
    
    liquidityPool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    liquidityPool.createdBlockNumber = event.block.number;
    liquidityPool.createdTimestamp = event.block.timestamp;
    liquidityPool.save();
  }
  return liquidityPool;
}

export function handlePoolAdded(event: PoolAdded): void {
  getOrCreatePool(event.params.pool, event.address, event);
}
