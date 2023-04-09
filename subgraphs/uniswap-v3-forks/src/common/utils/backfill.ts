import { Address, ethereum } from "@graphprotocol/graph-ts";
import { INT_ONE, INT_ZERO } from "../constants";
import { Pool } from "../../../generated/Factory/Pool";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { convertTokenToDecimal } from "./utils";
import { POOL_MAPPINGS } from "./poolMappings";
import {
  createLiquidityPool,
  getLiquidityPool,
  getLiquidityPoolAmounts,
} from "../entities/pool";
import { getOrCreateProtocol } from "../entities/protocol";
import { getOrCreateToken } from "../entities/token";

/**
 * Create entries in store for each pool and token
 * before regenesis.
 */
export function populateEmptyPools(event: ethereum.Event): void {
  const length = POOL_MAPPINGS.length;

  for (let i = 0; i < length; ++i) {
    const poolMapping = POOL_MAPPINGS[i];
    const poolAddress = poolMapping[1];
    const token0Address = poolMapping[2];
    const token1Address = poolMapping[3];
    const poolContract = Pool.bind(poolAddress);

    createLiquidityPool(
      event,
      poolAddress,
      token0Address,
      token1Address,
      poolContract.fee()
    );
    const pool = getLiquidityPool(poolAddress)!;
    const poolAmounts = getLiquidityPoolAmounts(poolAddress)!;

    // create the tokens and tokentracker
    const token0 = getOrCreateToken(event, token0Address);
    const token1 = getOrCreateToken(event, token1Address);

    // populate the TVL by call contract balanceOf
    const token0Contract = ERC20.bind(
      Address.fromBytes(pool.inputTokens[INT_ZERO])
    );
    const tvlToken0Raw = token0Contract.balanceOf(Address.fromBytes(pool.id));
    const tvlToken0Adjusted = convertTokenToDecimal(
      tvlToken0Raw,
      token0.decimals
    );

    const token1Contract = ERC20.bind(
      Address.fromBytes(pool.inputTokens[INT_ONE])
    );
    const tvlToken1Raw = token1Contract.balanceOf(Address.fromBytes(pool.id));
    const tvlToken1Adjusted = convertTokenToDecimal(
      tvlToken1Raw,
      token1.decimals
    );

    pool.inputTokenBalances = [tvlToken0Raw, tvlToken1Raw];
    poolAmounts.inputTokenBalances = [tvlToken0Adjusted, tvlToken1Adjusted];
    pool.totalLiquidity = poolContract.liquidity();
    pool.activeLiquidity = pool.totalLiquidity;

    poolAmounts.save();
    pool.save();
  }

  const protocol = getOrCreateProtocol();

  protocol._regenesis = true;
  protocol.save();
}
