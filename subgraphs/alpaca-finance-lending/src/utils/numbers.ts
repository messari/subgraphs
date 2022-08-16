import { BIGINT_TWO, BIGINT_ZERO, SECONDS_PER_YEAR } from "./constants";
import { Bytes, Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function extractCallData(bytes: Bytes, start: i32, end: i32): Bytes {
  return Bytes.fromUint8Array(bytes.subarray(start, end));
}

export function bytes32ToAddress(bytes: Bytes): Address {
  //take the last 40 hexstring & convert it to address (20 bytes)
  let address = bytes32ToAddressHexString(bytes);
  return Address.fromString(address);
}

export function bytes32ToAddressHexString(bytes: Bytes): string {
  //take the last 40 hexstring
  return bytes.toHexString().slice(26);
}

export function bytesToUnsignedBigInt(bytes: Bytes, bigEndian: boolean = true): BigInt {
  // Caution: this function changes the input bytes for bigEndian
  return BigInt.fromUnsignedBytes(bigEndian ? Bytes.fromUint8Array(bytes.reverse()) : bytes);
}

export function bytesToSignedBigInt(bytes: Bytes, bigEndian: boolean = true): BigInt {
  // Caution: this function changes the input bytes for bigEndian
  return BigInt.fromSignedBytes(bigEndian ? Bytes.fromUint8Array(bytes.reverse()) : bytes);
}


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

// returns 10^exp
export function exponentToBigDecimal(exp: i32): BigDecimal {
  let bd = BigDecimal.fromString("1");
  const ten = BigDecimal.fromString("10");
  for (let i = 0; i < exp; i++) {
    bd = bd.times(ten);
  }
  return bd;
}

export function calculateAverage(prices: BigDecimal[]): BigDecimal {
  let sum = BigDecimal.fromString("0");
  for (let i = 0; i < prices.length; i++) {
    sum = sum.plus(prices[i]);
  }

  return sum.div(
    BigDecimal.fromString(BigInt.fromI32(prices.length).toString())
  );
}

export function calculateMedian(prices: BigDecimal[]): BigDecimal {
  let sorted = prices.sort((a, b) => {
    return a.equals(b) ? 0 : a.gt(b) ? 1 : -1;
  });

  let mid = Math.ceil(sorted.length / 2) as i32;
  if (sorted.length % 2 == 0) {
    return sorted[mid].plus(sorted[mid - 1]).div(BigDecimal.fromString("2"));
  }

  return sorted[mid - 1];
}

// Ray is 27 decimal Wad is 18 decimal
// These functions were made for the AAVE subgraph. Visit the following link to verify that AAVE's definition for RAY units match what are needed for your protocol
// https://docs.aave.com/developers/v/2.0/glossary

export const RAY = BigInt.fromI32(10).pow(27);
const WAD_RAY_RATIO = BigInt.fromI32(10).pow(9);
const WAD = BigInt.fromI32(10).pow(18);
const halfRAY = RAY.div(BigInt.fromI32(2));

export function rayToWad(a: BigInt): BigInt {
  let halfRatio = WAD_RAY_RATIO.div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(WAD_RAY_RATIO);
}

export function wadToRay(a: BigInt): BigInt {
  let result = a.times(WAD_RAY_RATIO);
  return result;
}

export function rayDiv(a: BigInt, b: BigInt): BigInt {
  let halfB = b.div(BigInt.fromI32(2));
  let result = a.times(RAY);
  result = result.plus(halfB);
  let division = result.div(b);
  return division;
}

export function rayMul(a: BigInt, b: BigInt): BigInt {
  let result = a.times(b);
  result = result.plus(halfRAY);
  let mult = result.div(RAY);
  return mult;
}

export function rayPow(a: BigInt, p: BigInt): BigInt {
  let z = !p.mod(BIGINT_TWO).equals(BIGINT_ZERO) ? a : RAY;
  for (p = p.div(BIGINT_TWO); !p.equals(BIGINT_ZERO); p = p.div(BIGINT_TWO)) {
    a = rayMul(a, a);
    if (!p.mod(BIGINT_TWO).equals(BIGINT_ZERO)) {
      z = rayMul(z, a);
    }
  }
  return z;
}

export function rayAPRtoAPY(apr: BigInt): BigInt {
  return rayPow(apr.div(SECONDS_PER_YEAR).plus(RAY), SECONDS_PER_YEAR).minus(
    RAY
  );
}
