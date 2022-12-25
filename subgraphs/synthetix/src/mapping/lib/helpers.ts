import {
  BigDecimal,
  BigInt,
  Bytes,
  ByteArray,
  log,
  Address,
  dataSource,
} from "@graphprotocol/graph-ts";

import {
  LatestRate,
  FeeRate,
} from "../../generated/subgraphs/latest-rates/schema";
import { initFeed, initFeeRate } from "../fragments/latest-rates";
import { getContractDeployment } from "../../generated/addresses";

export let ZERO = BigInt.fromI32(0);
export let ONE = BigInt.fromI32(1);

export let ZERO_ADDRESS = changetype<Address>(
  Address.fromHexString("0x0000000000000000000000000000000000000000")
);
export let FEE_ADDRESS = changetype<Address>(
  Address.fromHexString("0xfeefeefeefeefeefeefeefeefeefeefeefeefeef")
);

export let FIFTEEN_MINUTE_SECONDS = BigInt.fromI32(900);
export let DAY_SECONDS = BigInt.fromI32(86400);
export let YEAR_SECONDS = BigInt.fromI32(31556736);

export let CANDLE_PERIODS: BigInt[] = [
  YEAR_SECONDS,
  YEAR_SECONDS.div(BigInt.fromI32(4)),
  YEAR_SECONDS.div(BigInt.fromI32(12)),
  DAY_SECONDS.times(BigInt.fromI32(7)),
  DAY_SECONDS,
  FIFTEEN_MINUTE_SECONDS.times(BigInt.fromI32(4)),
  FIFTEEN_MINUTE_SECONDS,
];

export function toDecimal(value: BigInt, decimals: u32 = 18): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal();

  return value.divDecimal(precision);
}

export function strToBytes(str: string, length: i32 = 32): Bytes {
  return Bytes.fromByteArray(Bytes.fromUTF8(str));
}

export let sUSD32 = strToBytes("sUSD", 32);
export let sUSD4 = strToBytes("sUSD", 4);

export function getTimeID(timestamp: BigInt, num: BigInt): BigInt {
  let remainder = timestamp.mod(num);
  return timestamp.minus(remainder);
}

export function getUSDAmountFromAssetAmount(
  amount: BigInt,
  rate: BigDecimal
): BigDecimal {
  let decimalAmount = toDecimal(amount);
  return decimalAmount.times(rate);
}

export function getLatestRate(
  synth: string,
  txHash: string
): BigDecimal | null {
  let latestRate = LatestRate.load(synth);
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
  let rate = FeeRate.load(type + "-" + synth);
  if (rate == null) {
    log.warning("atomic exchange rate missing for synth: {}", [synth]);

    // load feed for the first time, and use contract call to get rate
    return initFeeRate(type, synth);
  }
  return rate.rate;
}

export function isEscrow(holder: string, network: string): boolean {
  return (
    getContractDeployment(
      "SynthetixEscrow",
      dataSource.network(),
      BigInt.fromI32(1000000000)
    )!.toHexString() == holder ||
    getContractDeployment(
      "RewardEscrow",
      dataSource.network(),
      BigInt.fromI32(1000000000)
    )!.toHexString() == holder
  );
}
