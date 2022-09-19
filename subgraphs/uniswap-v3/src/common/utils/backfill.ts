import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../configurations/configure";
import {
  LiquidityPool,
  _HelperStore,
  _LiquidityPoolAmount,
} from "../../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
} from "../constants";
import {
  getOrCreateDex,
  getOrCreateLPToken,
  getOrCreateToken,
  getTradingFee,
} from "../getters";
import { updateTokenWhitelists } from "../updateMetrics";
import { Pool as PoolTemplate } from "../../../generated/templates";
import { Pool } from "../../../generated/Factory/Pool";
import { createPoolFees } from "../creators";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { convertTokenToDecimal } from "./utils";
import { POOL_MAPPINGS } from "./poolMappings";

/**
 * Create entries in store for each pool and token
 * before regenesis.
 */
export function populateEmptyPools(event: ethereum.Event): void {
  let protocol = getOrCreateDex();
  let length = POOL_MAPPINGS.length;

  for (let i = 0; i < length; ++i) {
    let poolMapping = POOL_MAPPINGS[i];
    let poolAddress = poolMapping[1].toHexString();
    let token0Address = poolMapping[2].toHexString();
    let token1Address = poolMapping[3].toHexString();

    // create the tokens and tokentracker
    let token0 = getOrCreateToken(token0Address);
    let token1 = getOrCreateToken(token1Address);
    let LPtoken = getOrCreateLPToken(poolAddress, token0, token1);

    updateTokenWhitelists(token0, token1, poolAddress);

    let poolContract = Pool.bind(Address.fromString(poolAddress));
    let pool = new LiquidityPool(poolAddress);
    let poolAmounts = new _LiquidityPoolAmount(poolAddress);

    pool.protocol = protocol.id;
    pool.inputTokens = [token0.id, token1.id];
    pool.outputToken = LPtoken.id;
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
    pool.inputTokenWeights = [
      BIGDECIMAL_ONE.div(BIGDECIMAL_TWO),
      BIGDECIMAL_ONE.div(BIGDECIMAL_TWO),
    ];
    pool.outputTokenSupply = BIGINT_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.rewardTokens = [NetworkConfigs.getRewardToken()];
    pool.stakedOutputTokenAmount = BIGINT_ZERO;
    pool.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
    pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    pool.fees = createPoolFees(poolAddress, poolContract.fee());
    pool.isSingleSided = false;
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
    pool.symbol = LPtoken.symbol;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    pool.name =
      protocol.name +
      " " +
      LPtoken.symbol +
      " " +
      getTradingFee(pool.id).toString() +
      "%";

    poolAmounts.inputTokens = [token0.id, token1.id];
    poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
    poolAmounts.tokenPrices = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

    // populate the TVL by call contract balanceOf
    let token0Contract = ERC20.bind(
      Address.fromString(pool.inputTokens[INT_ZERO])
    );
    let tvlToken0Raw = token0Contract.balanceOf(Address.fromString(pool.id));
    let tvlToken0Adjusted = convertTokenToDecimal(
      tvlToken0Raw,
      token0.decimals
    );

    let token1Contract = ERC20.bind(
      Address.fromString(pool.inputTokens[INT_ONE])
    );
    let tvlToken1Raw = token1Contract.balanceOf(Address.fromString(pool.id));
    let tvlToken1Adjusted = convertTokenToDecimal(
      tvlToken1Raw,
      token1.decimals
    );

    pool.inputTokenBalances = [tvlToken0Raw, tvlToken1Raw];
    poolAmounts.inputTokenBalances = [tvlToken0Adjusted, tvlToken1Adjusted];

    // Used to track the number of deposits in a liquidity pool
    let poolDeposits = new _HelperStore(poolAddress);
    poolDeposits.valueInt = INT_ZERO;

    protocol.totalPoolCount = protocol.totalPoolCount + INT_ONE;

    // Create and track the newly created pool contract based on the template specified in the subgraph.yaml file.
    PoolTemplate.create(Address.fromString(poolAddress));

    poolDeposits.save();
    poolAmounts.save();
    token0.save();
    token1.save();
    pool.save();
  }

  protocol._regenesis = true;
  protocol.save();
}
