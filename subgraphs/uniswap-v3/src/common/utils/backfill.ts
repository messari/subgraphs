import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  LiquidityPool,
  _HelperStore,
  _LiquidityPoolAmount,
} from "../../../generated/schema";
import {
  BIGDECIMAL_FIFTY,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  TokenType,
} from "../constants";
import { Pool as PoolTemplate } from "../../../generated/templates";
import { Pool } from "../../../generated/Factory/Pool";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { convertTokenToDecimal } from "./utils";
import { POOL_MAPPINGS } from "./poolMappings";
import { getTradingFee, createPoolFees } from "../entities/pool";
import { getOrCreateProtocol } from "../entities/protocol";
import { getOrCreateToken, updateTokenWhitelists } from "../entities/token";

/**
 * Create entries in store for each pool and token
 * before regenesis.
 */
export function populateEmptyPools(event: ethereum.Event): void {
  const protocol = getOrCreateProtocol();
  const length = POOL_MAPPINGS.length;

  for (let i = 0; i < length; ++i) {
    const poolMapping = POOL_MAPPINGS[i];
    const poolAddress = poolMapping[1];
    const token0Address = poolMapping[2];
    const token1Address = poolMapping[3];

    // create the tokens and tokentracker
    const token0 = getOrCreateToken(event, token0Address);
    const token1 = getOrCreateToken(event, token1Address);

    updateTokenWhitelists(token0, token1, poolAddress);

    const poolContract = Pool.bind(poolAddress);
    const pool = new LiquidityPool(poolAddress);
    const poolAmounts = new _LiquidityPoolAmount(poolAddress);

    pool.protocol = protocol.id;
    pool.name =
      protocol.name +
      " " +
      token0.name +
      "/" +
      token1.name +
      " " +
      getTradingFee(poolAddress).toString() +
      "%";
    pool.symbol = token0.name + "/" + token1.name;
    pool.inputTokens = [token0.id, token1.id];
    pool.inputTokenWeights = [BIGDECIMAL_FIFTY, BIGDECIMAL_FIFTY];
    pool.tick = BIGINT_ZERO;
    pool.fees = createPoolFees(poolAddress, poolContract.fee());
    pool.isSingleSided = false;
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;

    pool.liquidityToken = null;
    pool.liquidityTokenType = TokenType.MULTIPLE;

    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.totalLiquidity = BIGINT_ZERO;
    pool.totalLiquidityUSD = BIGDECIMAL_ZERO;
    pool.activeLiquidity = BIGINT_ZERO;
    pool.activeLiquidityUSD = BIGDECIMAL_ZERO;

    pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    pool.inputTokenBalancesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    pool.cumulativeTotalVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
    pool.cumulativeVolumesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    pool.uncollectedProtocolSideTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
    pool.uncollectedProtocolSideValuesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    pool.uncollectedSupplySideTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
    pool.uncollectedSupplySideValuesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    pool.positionCount = INT_ZERO;
    pool.openPositionCount = INT_ZERO;
    pool.closedPositionCount = INT_ZERO;

    pool._totalAmountWithdrawn = [BIGINT_ZERO, BIGINT_ZERO];
    pool._totalAmountCollected = [BIGINT_ZERO, BIGINT_ZERO];
    pool._totalAmountEarned = [BIGINT_ZERO, BIGINT_ZERO];
    pool._mostRecentSnapshotsDayID = INT_ZERO;
    pool._mostRecentSnapshotsHourID = INT_ZERO;

    poolAmounts.inputTokens = [token0.id, token1.id];
    poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolAmounts.tokenPrices = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

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

    // Used to track the number of deposits in a liquidity pool
    const poolDeposits = new _HelperStore(poolAddress);
    poolDeposits.valueInt = INT_ZERO;

    protocol.totalPoolCount = protocol.totalPoolCount + INT_ONE;

    // Create and track the newly created pool contract based on the template specified in the subgraph.yaml file.
    PoolTemplate.create(poolAddress);

    poolDeposits.save();
    poolAmounts.save();
    token0.save();
    token1.save();
    pool.save();
  }

  protocol._regenesis = true;
  protocol.save();
}
