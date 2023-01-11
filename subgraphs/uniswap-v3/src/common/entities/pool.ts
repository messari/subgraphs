import {
  BigDecimal,
  log,
  ethereum,
  Address,
  BigInt,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  LiquidityPool,
  _LiquidityPoolAmount,
  LiquidityPoolFee,
  _HelperStore,
} from "../../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BIGDECIMAL_FIFTY,
  INT_ONE,
  INT_ZERO,
  LiquidityPoolFeeType,
  PROTOCOL_FEE_TO_OFF,
  TokenType,
} from "../constants";
import { convertFeeToPercent, convertTokenToDecimal } from "../utils/utils";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreateToken, updateTokenWhitelists } from "./token";
import { Pool as PoolTemplate } from "../../../generated/templates";

// Create a liquidity pool from pairCreated event.
export function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: Address,
  token0Address: Address,
  token1Address: Address,
  fees: i32
): void {
  const protocol = getOrCreateProtocol();

  // create the tokens and tokentracker
  const token0 = getOrCreateToken(event, token0Address);
  const token1 = getOrCreateToken(event, token1Address);

  updateTokenWhitelists(token0, token1, poolAddress);

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
    convertFeeToPercent(fees).toString() +
    "%";
  pool.symbol = token0.name + "/" + token1.name;
  pool.inputTokens = [token0.id, token1.id];
  pool.inputTokenWeights = [BIGDECIMAL_FIFTY, BIGDECIMAL_FIFTY];

  pool.fees = createPoolFees(poolAddress, fees);
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

  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
  pool.cumulativeVolumesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

  pool.uncollectedProtocolSideTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
  pool.uncollectedProtocolSideValuesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  pool.uncollectedSupplySideTokenAmounts = [BIGINT_ZERO, BIGINT_ZERO];
  pool.uncollectedSupplySideValuesUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  pool.cumulativeDepositCount = INT_ZERO;
  pool.cumulativeWithdrawCount = INT_ZERO;
  pool.cumulativeSwapCount = INT_ZERO;

  pool.positionCount = INT_ZERO;
  pool.openPositionCount = INT_ZERO;
  pool.closedPositionCount = INT_ZERO;

  pool.lastSnapshotsDayID = INT_ZERO;
  pool.lastSnapshotsHourID = INT_ZERO;
  pool.lastUpdateBlockNumber = event.block.number;
  pool.lastUpdateTimestamp = event.block.timestamp;

  pool._totalAmountWithdrawn = [BIGINT_ZERO, BIGINT_ZERO];
  pool._totalAmountCollected = [BIGINT_ZERO, BIGINT_ZERO];
  pool._totalAmountEarned = [BIGINT_ZERO, BIGINT_ZERO];

  poolAmounts.inputTokens = [token0.id, token1.id];
  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  poolAmounts.tokenPrices = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // Used to track the number of deposits in a liquidity pool
  const poolDeposits = new _HelperStore(poolAddress);
  poolDeposits.valueInt = INT_ZERO;

  protocol.totalPoolCount = protocol.totalPoolCount + INT_ONE;

  // Create and track the newly created pool contract based on the template specified in the subgraph.yaml file.
  PoolTemplate.create(poolAddress);

  protocol.save();
  pool.save();
  poolAmounts.save();
  token0.save();
  token1.save();
  poolDeposits.save();
}

// create pool fee entities based on the fee structure received from pairCreated event.
export function createPoolFees(poolAddress: Bytes, fee: i64): Bytes[] {
  // LP Fee
  const poolLpFee = new LiquidityPoolFee(
    Bytes.fromHexString("xlp-fee-").concat(poolAddress)
  );
  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolLpFee.feePercentage = convertFeeToPercent(fee);

  // Protocol Fee
  const poolProtocolFee = new LiquidityPoolFee(
    Bytes.fromHexString("xprotocol-fee-").concat(poolAddress)
  );
  poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  poolProtocolFee.feePercentage = PROTOCOL_FEE_TO_OFF;

  // Trading Fee
  const poolTradingFee = new LiquidityPoolFee(
    Bytes.fromHexString("trading-fee-").concat(poolAddress)
  );
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
  poolTradingFee.feePercentage = convertFeeToPercent(fee);

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}

export function getLiquidityPool(poolAddress: Bytes): LiquidityPool | null {
  return LiquidityPool.load(poolAddress);
}

export function getLiquidityPoolAmounts(
  poolAddress: Bytes
): _LiquidityPoolAmount | null {
  return _LiquidityPoolAmount.load(poolAddress);
}

export function getLiquidityPoolFee(id: Bytes): LiquidityPoolFee {
  return LiquidityPoolFee.load(id)!;
}

export function getTradingFee(poolAddress: Bytes): BigDecimal {
  const feeId = Bytes.fromHexString("trading-fee-").concat(poolAddress);
  const fee = LiquidityPoolFee.load(feeId);
  if (fee === null) {
    log.warning(
      "LiquidityPoolFee not found for pool: " + poolAddress.toHexString(),
      []
    );
    return BIGDECIMAL_ZERO;
  }
  return fee.feePercentage!;
}

// Get amounts in USD given a list of amounts and a pool
export function getAmountUSD(
  event: ethereum.Event,
  pool: LiquidityPool,
  amounts: BigInt[]
): BigDecimal[] {
  const amountsUSD: BigDecimal[] = [];
  for (let i = 0; i < amounts.length; i++) {
    const token = getOrCreateToken(event, pool.inputTokens[i]);
    amountsUSD.push(
      convertTokenToDecimal(amounts[i], token.decimals).times(
        token.lastPriceUSD!
      )
    );
  }
  return amountsUSD;
}
