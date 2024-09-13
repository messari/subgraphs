// import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// import {
//   BIGDECIMAL_ONE,
//   BIGDECIMAL_TEN,
//   BIGDECIMAL_ZERO,
//   BIGINT_NINE,
//   BIGINT_ONE,
//   BIGINT_ZERO,
//   DEFAULT_DECIMALS,
//   QI92,
// } from "../sdk/util/constants";
// import { NetworkConfigs } from "../../configurations/configure";

// import { UniswapV3Pool } from "../../generated/PLXTAO/UniswapV3Pool";

// export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
//   let bd = BIGDECIMAL_ONE;
//   for (let i = BIGINT_ZERO; i.lt(decimals); i = i.plus(BIGINT_ONE)) {
//     bd = bd.times(BIGDECIMAL_TEN);
//   }
//   return bd;
// }

// export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
//   if (amount1.equals(BIGDECIMAL_ZERO)) {
//     return BIGDECIMAL_ZERO;
//   } else {
//     return amount0.div(amount1);
//   }
// }
// export function sqrtPriceX96ToTokenPrices(
//   sqrtPriceX96: BigInt,
//   token0Decimals: BigInt,
//   token1Decimals: BigInt
// ): BigDecimal[] {
//   const num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal();
//   const denom = QI92;
//   const price1 = num
//     .div(denom)
//     .times(exponentToBigDecimal(token0Decimals))
//     .div(exponentToBigDecimal(token1Decimals));

//   const price0 = safeDiv(BIGDECIMAL_ONE, price1);
//   return [price0, price1];
// }

// export function getPriceForPair(address: Address): BigDecimal[] {
//   const uniswapPool = UniswapV3Pool.bind(address);
//   const slot0 = uniswapPool.slot0();
//   const sqrtPriceX96 = slot0.value0;
//   const prices = sqrtPriceX96ToTokenPrices(
//     sqrtPriceX96,
//     BIGINT_NINE,
//     BigInt.fromI32(DEFAULT_DECIMALS)
//   );

//   return prices;
// }

// export function getTAOPriceFromUniV3(ethPriceUSD: BigDecimal): BigDecimal {
//   const pair = NetworkConfigs.getPairAddress();
//   const prices = getPriceForPair(pair);

//   return prices[1].times(ethPriceUSD);
// }
