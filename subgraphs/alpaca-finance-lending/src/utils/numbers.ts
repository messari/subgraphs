import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = 18
): BigDecimal {
  return quantity.divDecimal(
    BigInt.fromI32(10)
      .pow(decimals as u8)
      .toBigDecimal()
  );
}

// returns a^exp
export function exponent(a: BigDecimal, exp: i32): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = 0; i < exp; i++) {
    bd = bd.times(a);
  }
  return bd;
}

// returns 10^exp
export function exponentToBigDecimal(exp: i32): BigDecimal {
  let bd = BigDecimal.fromString("1");
  const ten = BigDecimal.fromString("10");
  for (let i = 0; i < exp; i++) {
    bd = bd.times(ten);
  }
  return bd;
}

export function bigDecimalToBigInt(quantity: BigDecimal): BigInt {
  return BigInt.fromString(quantity.toString().split(".")[0]);
}
