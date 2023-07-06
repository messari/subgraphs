import { minBN } from "../constants";
import PercentMath from "./maths/percentMath";
import { IMaths } from "./maths/mathsInterface";
import { BigInt } from "@graphprotocol/graph-ts";

export class GrowthFactors {
  p2pBorrowGrowthFactor: BigInt;
  p2pSupplyGrowthFactor: BigInt;
  poolBorrowGrowthFactor: BigInt;
  poolSupplyGrowthFactor: BigInt;

  constructor(
    p2pBorrowGrowthFactor: BigInt,
    p2pSupplyGrowthFactor: BigInt,
    poolBorrowGrowthFactor: BigInt,
    poolSupplyGrowthFactor: BigInt
  ) {
    this.p2pBorrowGrowthFactor = p2pBorrowGrowthFactor;
    this.p2pSupplyGrowthFactor = p2pSupplyGrowthFactor;
    this.poolBorrowGrowthFactor = poolBorrowGrowthFactor;
    this.poolSupplyGrowthFactor = poolSupplyGrowthFactor;
  }
}

function computeP2PRate(
  poolBorrowRate: BigInt,
  poolSupplyRate: BigInt,
  p2pIndexCursor: BigInt
): BigInt {
  if (poolBorrowRate.lt(poolSupplyRate)) return poolBorrowRate;
  return PercentMath.weightedAvg(
    poolSupplyRate,
    poolBorrowRate,
    p2pIndexCursor
  );
}

export function computeGrowthFactors(
  newPoolSupplyIndex: BigInt,
  newPoolBorrowIndex: BigInt,
  lastSupplyPoolIndex: BigInt,
  lastBorrowPoolIndex: BigInt,
  p2pIndexCursor: BigInt,
  reserveFactor: BigInt,
  __MATHS__: IMaths
): GrowthFactors {
  const poolSupplyGrowthFactor: BigInt = __MATHS__.indexDiv(
    newPoolSupplyIndex,
    lastSupplyPoolIndex
  );
  const poolBorrowGrowthFactor: BigInt = __MATHS__.indexDiv(
    newPoolBorrowIndex,
    lastBorrowPoolIndex
  );

  let p2pSupplyGrowthFactor: BigInt;
  let p2pBorrowGrowthFactor: BigInt;

  if (poolSupplyGrowthFactor <= poolBorrowGrowthFactor) {
    const p2pGrowthFactor = PercentMath.weightedAvg(
      poolSupplyGrowthFactor,
      poolBorrowGrowthFactor,
      p2pIndexCursor
    );

    p2pSupplyGrowthFactor = p2pGrowthFactor.minus(
      PercentMath.percentMul(
        p2pGrowthFactor.minus(poolSupplyGrowthFactor),
        reserveFactor
      )
    );
    p2pBorrowGrowthFactor = p2pGrowthFactor.plus(
      PercentMath.percentMul(
        poolBorrowGrowthFactor.minus(p2pGrowthFactor),
        reserveFactor
      )
    );
  } else {
    // The case poolSupplyGrowthFactor > poolBorrowGrowthFactor happens because someone sent underlying tokens to the
    // cToken contract: the peer-to-peer growth factors are set to the pool borrow growth factor.
    p2pSupplyGrowthFactor = poolBorrowGrowthFactor;
    p2pBorrowGrowthFactor = poolBorrowGrowthFactor;
  }
  return new GrowthFactors(
    p2pBorrowGrowthFactor,
    p2pSupplyGrowthFactor,
    poolBorrowGrowthFactor,
    poolSupplyGrowthFactor
  );
}

export function computeP2PIndex(
  lastPoolIndex: BigInt,
  lastP2PIndex: BigInt,
  p2pGrowthFactor: BigInt,
  poolGrowthFactor: BigInt,
  p2pDelta: BigInt,
  p2pAmount: BigInt,
  proportionIdle: BigInt,
  __MATHS__: IMaths
): BigInt {
  let newP2PIndex: BigInt;
  if (p2pAmount.isZero() || (p2pDelta.isZero() && proportionIdle.isZero())) {
    newP2PIndex = __MATHS__.indexMul(lastP2PIndex, p2pGrowthFactor);
  } else {
    const shareOfTheDelta: BigInt = minBN(
      __MATHS__.indexDiv(
        __MATHS__.indexMul(p2pDelta, lastPoolIndex),
        __MATHS__.indexMul(p2pAmount, lastP2PIndex)
      ),
      __MATHS__.INDEX_ONE().minus(proportionIdle) // To avoid shareOfTheDelta + proportionIdle > 1 with rounding errors.
    );
    newP2PIndex = __MATHS__.indexMul(
      lastP2PIndex,
      __MATHS__
        .indexMul(
          __MATHS__.INDEX_ONE().minus(shareOfTheDelta).minus(proportionIdle),
          p2pGrowthFactor
        )
        .plus(__MATHS__.indexMul(shareOfTheDelta, poolGrowthFactor))
        .plus(proportionIdle)
    );
  }
  return newP2PIndex;
}

export function computeP2PSupplyRate(
  poolBorrowRate: BigInt,
  poolSupplyRate: BigInt,
  poolIndex: BigInt,
  p2pIndex: BigInt,
  p2pIndexCursor: BigInt,
  p2pDelta: BigInt,
  p2pAmount: BigInt,
  reserveFactor: BigInt,
  proportionIdle: BigInt,
  __MATHS__: IMaths
): BigInt {
  let p2pSupplyRate: BigInt;
  if (poolSupplyRate.gt(poolBorrowRate)) {
    p2pSupplyRate = poolBorrowRate;
  } else {
    const p2pRate = computeP2PRate(
      poolBorrowRate,
      poolSupplyRate,
      p2pIndexCursor
    );
    p2pSupplyRate = p2pRate.minus(
      PercentMath.percentMul(p2pRate.minus(poolSupplyRate), reserveFactor)
    );
  }
  if (p2pDelta.gt(BigInt.zero()) && p2pAmount.gt(BigInt.zero())) {
    const shareOfTheDelta = minBN(
      __MATHS__.indexDiv(
        __MATHS__.indexMul(p2pDelta, poolIndex),
        __MATHS__.indexMul(p2pAmount, p2pIndex)
      ),
      __MATHS__.INDEX_ONE().minus(proportionIdle) // To avoid shareOfTheDelta > 1 with rounding errors.
    );

    p2pSupplyRate = __MATHS__
      .indexMul(
        p2pSupplyRate,
        __MATHS__.INDEX_ONE().minus(shareOfTheDelta).minus(proportionIdle)
      )
      .plus(__MATHS__.indexMul(poolSupplyRate, shareOfTheDelta))
      .plus(proportionIdle);
  }
  return p2pSupplyRate;
}

export function computeP2PBorrowRate(
  poolBorrowRate: BigInt,
  poolSupplyRate: BigInt,
  poolIndex: BigInt,
  p2pIndex: BigInt,
  p2pIndexCursor: BigInt,
  p2pDelta: BigInt,
  p2pAmount: BigInt,
  reserveFactor: BigInt,
  proportionIdle: BigInt,
  __MATHS__: IMaths
): BigInt {
  let p2pBorrowRate: BigInt;
  if (poolSupplyRate.gt(poolBorrowRate)) {
    p2pBorrowRate = poolBorrowRate;
  } else {
    const p2pRate = computeP2PRate(
      poolBorrowRate,
      poolSupplyRate,
      p2pIndexCursor
    );
    p2pBorrowRate = p2pRate.plus(
      PercentMath.percentMul(poolBorrowRate.minus(p2pRate), reserveFactor)
    );
  }

  if (p2pDelta.gt(BigInt.zero()) && p2pAmount.gt(BigInt.zero())) {
    const shareOfTheDelta = minBN(
      __MATHS__.indexDiv(
        __MATHS__.indexMul(p2pDelta, poolIndex),
        __MATHS__.indexMul(p2pAmount, p2pIndex)
      ),
      __MATHS__.INDEX_ONE().minus(proportionIdle) // To avoid shareOfTheDelta > 1 with rounding errors.
    );

    p2pBorrowRate = __MATHS__
      .indexMul(
        p2pBorrowRate,
        __MATHS__.INDEX_ONE().minus(shareOfTheDelta).minus(proportionIdle)
      )
      .plus(__MATHS__.indexMul(poolBorrowRate, shareOfTheDelta))
      .plus(proportionIdle);
  }
  return p2pBorrowRate;
}
