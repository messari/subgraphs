// Update usage metrics entities
import { Address, BigDecimal, ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  DexAmmProtocol,
  Token,
  _MultiToken,
  _MultiTokenDailySnapshot,
  _TokenDailySnapshot,
} from "../../generated/schema";
import { TokenCollection } from "../handlers/handleSwapped";
import { INT_ONE, SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateMultiTokenDailySnapshot,
  getOrCreateProtocol,
  getOrCreateTokenDailySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";

// Updated on Swap, Burn, and Mint events.
// Updated on Swap, Burn, and Mint events.
export function updateUsageMetrics(
  event: ethereum.Event,
  fromAddress: Address
): void {
  const from = fromAddress.toHexString();

  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  const protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  usageMetricsDaily.dailySwapCount += INT_ONE;
  usageMetricsHourly.hourlySwapCount += INT_ONE;

  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const dayId = day.toString();
  const hourId = hour.toString();

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = from.concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = from.concat("-").concat(hourId);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    usageMetricsHourly.hourlyActiveUsers += INT_ONE;
    hourlyActiveAccount.save();
  }

  let account = Account.load(from);
  if (!account) {
    account = new Account(from);
    protocol.cumulativeUniqueUsers += INT_ONE;
    account.save();
  }
  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  usageMetricsDaily.save();
  usageMetricsHourly.save();
  protocol.save();
}

// Update the volume and fees from financial metrics snapshot, pool metrics snapshot, protocol, and pool entities.
// Updated on Swap event.
export function updateVolumes(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  multiToken: _MultiToken,
  tokensIn: Token[],
  amountsIn: BigInt[],
  amountsInUSD: BigDecimal[],
  amountsOutUSD: BigDecimal[],
  amountUSD: BigDecimal
): void {
  const financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  const multiTokenDailySnapshot = getOrCreateMultiTokenDailySnapshot(
    event,
    multiToken
  );

  // Update volume occurred during swaps
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  financialMetrics.dailyVolumeUSD =
    financialMetrics.dailyVolumeUSD.plus(amountUSD);
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

  multiToken.cumulativeVolumeUSD =
    multiToken.cumulativeVolumeUSD.plus(amountUSD);
  multiTokenDailySnapshot.dailyVolumeUSD =
    multiTokenDailySnapshot.dailyVolumeUSD.plus(amountUSD);
  multiTokenDailySnapshot.cumulativeVolumeUSD = multiToken.cumulativeVolumeUSD;

  // Update volume for each token
  for (let i = 0; i < tokensIn.length; i++) {
    tokensIn[i]._cumulativeVolumeUSD = tokensIn[i]._cumulativeVolumeUSD.plus(
      amountsInUSD[i]
    );
    tokensIn[i]._cumulativeVolume = tokensIn[i]._cumulativeVolume.plus(
      amountsIn[i]
    );

    let tokenMetrics = getOrCreateTokenDailySnapshot(event, tokensIn[i]);
    tokenMetrics.dailyVolumeUSD = tokenMetrics.dailyVolumeUSD.plus(
      amountsInUSD[i]
    );
    tokenMetrics.dailyVolume = tokenMetrics.dailyVolume.plus(amountsIn[i]);
    tokenMetrics.cumulativeVolumeUSD = tokensIn[i]._cumulativeVolumeUSD;
    tokenMetrics.cumulativeVolume = tokensIn[i]._cumulativeVolume;

    tokenMetrics.save();
    tokensIn[i].save();
  }

  financialMetrics.save();
  protocol.save();
}

export function updateProtocolVolume(
  protocol: DexAmmProtocol,
  amountUSD: BigDecimal
): DexAmmProtocol {
  // Update volume occurred during swaps
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(amountUSD);
  protocol.save();

  return protocol;
}

export function updateFinancialsVolume(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  amountUSD: BigDecimal
): void {
  const financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  financialMetrics.dailyVolumeUSD =
    financialMetrics.dailyVolumeUSD.plus(amountUSD);
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

  financialMetrics.save();
}

export function updateTokenVolume(
  event: ethereum.Event,
  tokensInCollection: TokenCollection
): void {
  // Update volume for each token
  for (let i = 0; i < tokensInCollection.tokens.length; i++) {
    tokensInCollection.tokens[i]._cumulativeVolumeUSD =
      tokensInCollection.tokens[i]._cumulativeVolumeUSD.plus(
        tokensInCollection.amountsUSD[i]
      );
    tokensInCollection.tokens[i]._cumulativeVolume = tokensInCollection.tokens[
      i
    ]._cumulativeVolume.plus(tokensInCollection.amounts[i]);

    // Update volumes for token snapshots
    let tokenMetrics = getOrCreateTokenDailySnapshot(
      event,
      tokensInCollection.tokens[i]
    );
    tokenMetrics.dailyVolumeUSD = tokenMetrics.dailyVolumeUSD.plus(
      tokensInCollection.amountsUSD[i]
    );
    tokenMetrics.dailyVolume = tokenMetrics.dailyVolume.plus(
      tokensInCollection.amounts[i]
    );
    tokenMetrics.cumulativeVolumeUSD =
      tokensInCollection.tokens[i]._cumulativeVolumeUSD;
    tokenMetrics.cumulativeVolume =
      tokensInCollection.tokens[i]._cumulativeVolume;

    tokenMetrics.save();
    tokensInCollection.tokens[i].save();
  }
}

export function updateMultiTokenVolume(
  event: ethereum.Event,
  multiToken: _MultiToken,
  tokensInCollection: TokenCollection,
  tokensOutCollection: TokenCollection,
  amountUSD: BigDecimal
): void {
  const multiTokenDailySnapshot = getOrCreateMultiTokenDailySnapshot(
    event,
    multiToken
  );

  // Create volume arrays for multi token and snapshot
  // In
  let cumulativeInVolumesUSD = new Array<BigDecimal>(
    multiToken.tokensIn.length
  );
  let cumulativeInVolumes = new Array<BigInt>(multiToken.tokensIn.length);

  let dailyInVolumesUSD = new Array<BigDecimal>(multiToken.tokensIn.length);
  let dailyInVolumes = new Array<BigInt>(multiToken.tokensIn.length);

  // Out
  let cumulativeOutVolumesUSD = new Array<BigDecimal>(
    multiToken.tokensOut.length
  );
  let cumulativeOutVolumes = new Array<BigInt>(multiToken.tokensOut.length);

  let dailyOutVolumesUSD = new Array<BigDecimal>(multiToken.tokensOut.length);
  let dailyOutVolumes = new Array<BigInt>(multiToken.tokensOut.length);

  // Update volume occurred during swaps and populate volume arrays
  // In
  for (let i = 0; i < multiToken.tokensIn.length; i++) {
    cumulativeInVolumesUSD[i] = multiToken.cumulativeInVolumesUSD[i].plus(
      tokensInCollection.amountsUSD[i]
    );
    cumulativeInVolumes[i] = multiToken.cumulativeInVolumes[i].plus(
      tokensInCollection.amounts[i]
    );

    dailyInVolumesUSD[i] = multiTokenDailySnapshot.dailyInVolumesUSD[i].plus(
      tokensInCollection.amountsUSD[i]
    );
    dailyInVolumes[i] = multiTokenDailySnapshot.dailyInVolumes[i].plus(
      tokensInCollection.amounts[i]
    );
  }

  // Out
  for (let i = 0; i < multiToken.tokensOut.length; i++) {
    cumulativeOutVolumesUSD[i] = multiToken.cumulativeOutVolumesUSD[i].plus(
      tokensOutCollection.amountsUSD[i]
    );
    cumulativeOutVolumes[i] = multiToken.cumulativeOutVolumes[i].plus(
      tokensOutCollection.amounts[i]
    );

    dailyOutVolumesUSD[i] = multiTokenDailySnapshot.dailyOutVolumesUSD[i].plus(
      tokensOutCollection.amountsUSD[i]
    );
    dailyOutVolumes[i] = multiTokenDailySnapshot.dailyOutVolumes[i].plus(
      tokensOutCollection.amounts[i]
    );
  }

  // Apply volume arrays to multi token and snapshot entities
  // In
  multiToken.cumulativeInVolumesUSD = cumulativeInVolumesUSD;
  multiToken.cumulativeInVolumes = cumulativeInVolumes;

  multiTokenDailySnapshot.cumulativeInVolumesUSD = cumulativeInVolumesUSD;
  multiTokenDailySnapshot.cumulativeInVolumes = cumulativeInVolumes;
  multiTokenDailySnapshot.dailyInVolumesUSD = dailyInVolumesUSD;
  multiTokenDailySnapshot.dailyInVolumes = dailyInVolumes;

  // Out
  multiToken.cumulativeOutVolumesUSD = cumulativeOutVolumesUSD;
  multiToken.cumulativeOutVolumes = cumulativeOutVolumes;

  multiTokenDailySnapshot.cumulativeOutVolumesUSD = cumulativeOutVolumesUSD;
  multiTokenDailySnapshot.cumulativeOutVolumes = cumulativeOutVolumes;
  multiTokenDailySnapshot.dailyOutVolumesUSD = dailyOutVolumesUSD;
  multiTokenDailySnapshot.dailyOutVolumes = dailyOutVolumes;

  // Update total volume USD for multi token and snapshot
  multiToken.cumulativeVolumeUSD =
    multiToken.cumulativeVolumeUSD.plus(amountUSD);
  multiTokenDailySnapshot.dailyVolumeUSD =
    multiTokenDailySnapshot.dailyVolumeUSD.plus(amountUSD);
  multiTokenDailySnapshot.cumulativeVolumeUSD = multiToken.cumulativeVolumeUSD;

  multiTokenDailySnapshot.save();
  multiToken.save();
}
