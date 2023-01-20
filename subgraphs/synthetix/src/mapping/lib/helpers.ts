import {
  BigDecimal,
  BigInt,
  Bytes,
  log,
  Address,
  dataSource,
} from "@graphprotocol/graph-ts";

import { LatestRate, FeeRate } from "../../../generated/schema";
import { initFeed, initFeeRate } from "../fragments/latest-rates";
import { getContractDeployment } from "../../../protocols/addresses";

export const ZERO = BigInt.fromI32(0);
export const ONE = BigInt.fromI32(1);

export const ZERO_ADDRESS = changetype<Address>(
  Address.fromHexString("0x0000000000000000000000000000000000000000")
);
export const FEE_ADDRESS = changetype<Address>(
  Address.fromHexString("0xfeefeefeefeefeefeefeefeefeefeefeefeefeef")
);

export const FIFTEEN_MINUTE_SECONDS = BigInt.fromI32(900);
export const DAY_SECONDS = BigInt.fromI32(86400);
export const YEAR_SECONDS = BigInt.fromI32(31556736);

export const CANDLE_PERIODS: BigInt[] = [
  YEAR_SECONDS,
  YEAR_SECONDS.div(BigInt.fromI32(4)),
  YEAR_SECONDS.div(BigInt.fromI32(12)),
  DAY_SECONDS.times(BigInt.fromI32(7)),
  DAY_SECONDS,
  FIFTEEN_MINUTE_SECONDS.times(BigInt.fromI32(4)),
  FIFTEEN_MINUTE_SECONDS,
];

export function toDecimal(value: BigInt, decimals: u32 = 18): BigDecimal {
  const precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal();

  return value.divDecimal(precision);
}

export function strToBytes(str: string): Bytes {
  return Bytes.fromByteArray(Bytes.fromUTF8(str));
}

export const sUSD32 = strToBytes("sUSD", 32);
export const sUSD4 = strToBytes("sUSD", 4);

export function getTimeID(timestamp: BigInt, num: BigInt): BigInt {
  const remainder = timestamp.mod(num);
  return timestamp.minus(remainder);
}

export function getUSDAmountFromAssetAmount(
  amount: BigInt,
  rate: BigDecimal
): BigDecimal {
  const decimalAmount = toDecimal(amount);
  return decimalAmount.times(rate);
}

export function getLatestRate(
  synth: string,
  txHash: string
): BigDecimal | null {
  const latestRate = LatestRate.load(synth);
  if (latestRate == null) {
    log.warning("latest rate missing for synth: {}, in tx hash: {}", [
      synth,
      txHash,
    ]);

    // load feed for the first time, and use contract call to get rate
    return initFeed(synth);
  }
  return latestRate.rate;
}

export function getExchangeFee(type: string, synth: string): BigDecimal {
  const rate = FeeRate.load(type + "-" + synth);
  if (rate == null) {
    log.warning("atomic exchange rate missing for synth: {}", [synth]);

    // load feed for the first time, and use contract call to get rate
    return initFeeRate(type, synth);
  }
  return rate.rate;
}

export function isEscrow(holder: string): boolean {
  return (
    getContractDeployment(
      "SynthetixEscrow",
      dataSource.network()
    )!.toHexString() == holder ||
    getContractDeployment(
      "RewardEscrow",
      dataSource.network()
    )!.toHexString() == holder
  );
}

export function bigDecimalToBigInt(n: BigDecimal): BigInt {
  return BigInt.fromString(n.toString().split(".")[0]);
}
