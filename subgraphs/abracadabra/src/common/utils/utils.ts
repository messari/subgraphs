import { Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { InterestRate } from "../../../generated/schema";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

// create separate InterestRate Entities for each market snapshot
// this is needed to prevent snapshot rates from being pointers to the current rate
export function getSnapshotRates(rates: Bytes[], timeSuffix: string): Bytes[] {
  const snapshotRates: Bytes[] = [];
  for (let i = 0; i < rates.length; i++) {
    const rate = InterestRate.load(rates[i]);
    if (!rate) {
      log.warning("[getSnapshotRates] rate {} not found, should not happen", [
        rates[i].toHexString(),
      ]);
      continue;
    }

    // create new snapshot rate
    const snapshotRateId = rates[i]
      .concat(Bytes.fromUTF8("-"))
      .concat(Bytes.fromUTF8(timeSuffix));
    const snapshotRate = new InterestRate(snapshotRateId);
    snapshotRate.side = rate.side;
    snapshotRate.type = rate.type;
    snapshotRate.rate = rate.rate;
    snapshotRate.save();
    snapshotRates.push(snapshotRateId);
  }
  return snapshotRates;
}
