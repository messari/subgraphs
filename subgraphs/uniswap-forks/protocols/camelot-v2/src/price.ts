import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
} from "@graphprotocol/graph-ts/index";
import { LiquidityPool, Token, _HelperStore } from "../../../generated/schema";
import { Pair } from "../../../generated/templates/Pair/Pair";
import { BIGDECIMAL_ONE, BIGINT_TEN } from "../../../src/common/constants";
import { getLiquidityPoolFee } from "../../../src/common/getters";
import { PairType } from "./common/constants";

export function findStablePairUSDPriceForToken(
  pool: LiquidityPool,
  whitelistToken: Token,
  token: Token
): BigDecimal | null {
  // Check whether current pool is a stable pair using a different formula
  const helperStore = _HelperStore.load(pool.id)!;
  const stable = PairType.STABLE == helperStore.valueString;
  if (stable) {
    const rate = calculateRateForStablePair(
      pool,
      Pair.bind(Address.fromString(pool.id)),
      token,
      whitelistToken
    );
    if (!rate) {
      return null;
    }
    return rate.times(whitelistToken.lastPriceUSD!);
  }
  return null;
}

// Tried to return null from here and it did not
function get_token_index(pool: LiquidityPool, token: Token): i32 {
  if (pool.inputTokens[0] == token.id) {
    return 0;
  }
  if (pool.inputTokens[1] == token.id) {
    return 1;
  }
  return -1;
}

function calculateRateForStablePair(
  pool: LiquidityPool,
  pair: Pair,
  tokenIn: Token,
  tokenOut: Token
): BigDecimal | null {
  const tokenIndex = get_token_index(pool, tokenIn);
  const fee = getLiquidityPoolFee(
    pool.fees[tokenIndex].concat(`-${tokenIndex}`)
  );
  let amount = BIGINT_TEN.pow(tokenIn.decimals as u8);
  // Add fee to the amount being converted, because it will be subtracted before the calculation in getAmountOut
  amount = amount
    .divDecimal(BIGDECIMAL_ONE.minus(fee.feePercentage!))
    .truncate(0).digits;
  const rate = try_callGetAmountOut(
    pair,
    amount,
    Address.fromString(tokenIn.id)
  );
  if (!rate) {
    return null;
  }
  return rate.divDecimal(
    BIGINT_TEN.pow(tokenOut.decimals as u8).toBigDecimal()
  );
}

function try_callGetAmountOut(
  contract: ethereum.SmartContract,
  amountIn: BigInt,
  tokenIn: Address
): BigInt | null {
  const result = contract.tryCall(
    "getAmountOut",
    "getAmountOut(uint256,address):(uint256)",
    [
      ethereum.Value.fromUnsignedBigInt(amountIn),
      ethereum.Value.fromAddress(tokenIn),
    ]
  );
  if (result.reverted) {
    return null;
  }
  const value = result.value;
  return value[0].toBigInt();
}
