import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";

export function convertBigIntToBigDecimal(value: BigInt, decimals: i32): BigDecimal {
  if (value == BigInt.fromString("0")) {
    return BigDecimal.fromString("0");
  } else {
    return value
      .toBigDecimal()
      .div(convertIntToBigDecimal(decimals));
  }
}

function convertIntToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString("1");
  const bd10 = BigDecimal.fromString("10");

  for (let i = 0; i < decimals; i++) {
    bd = bd.times(bd10);
  }

  return bd;
}