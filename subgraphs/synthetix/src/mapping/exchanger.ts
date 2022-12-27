import {
  ExchangeEntrySettled as ExchangeEntrySettledEvent,
  ExchangeEntryAppended as ExchangeEntryAppendedEvent,
} from "../../generated/exchanger_Exchanger_0/Exchanger";

import { ExchangeTracking as ExchangeTrackingEventV2 } from "../../generated/exchanger_Synthetix_0/Synthetix";
import { ExchangeTracking as ExchangeTrackingEventV1 } from "../../generated/exchanger_SynthetixOldTracking/SynthetixOldTracking";

import {
  ExchangeEntrySettled,
  ExchangeEntryAppended,
  LatestRate,
  DailyExchangePartner,
  ExchangePartner,
  TemporaryExchangePartnerTracker,
} from "../../generated/schema";

import {
  getTimeID,
  getUSDAmountFromAssetAmount,
  toDecimal,
  DAY_SECONDS,
} from "./lib/helpers";

import { BigInt, log, BigDecimal, dataSource } from "@graphprotocol/graph-ts";

let partnerProgramStart = BigInt.fromI32(10782000);
let exchangerContractUpdate = BigInt.fromI32(12733161);

export function handleExchangeEntrySettled(
  event: ExchangeEntrySettledEvent
): void {
  let entity = new ExchangeEntrySettled(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.from = event.params.from;
  entity.src = event.params.src;
  entity.amount = toDecimal(event.params.amount);
  entity.dest = event.params.dest;
  entity.reclaim = toDecimal(event.params.reclaim);
  entity.rebate = toDecimal(event.params.rebate);
  entity.srcRoundIdAtPeriodEnd = event.params.srcRoundIdAtPeriodEnd;
  entity.destRoundIdAtPeriodEnd = event.params.destRoundIdAtPeriodEnd;
  entity.exchangeTimestamp = event.params.exchangeTimestamp;

  entity.save();
}

function createTempEntity(id: string): TemporaryExchangePartnerTracker {
  let newTempEntity = new TemporaryExchangePartnerTracker(id);
  newTempEntity.usdVolume = new BigDecimal(BigInt.fromI32(0));
  newTempEntity.usdFees = new BigDecimal(BigInt.fromI32(0));
  newTempEntity.partner = null;
  return newTempEntity;
}

function resetTempEntity(txHash: string): void {
  let tempEntity = TemporaryExchangePartnerTracker.load(txHash)!;
  tempEntity.usdVolume = new BigDecimal(BigInt.fromI32(0));
  tempEntity.usdFees = new BigDecimal(BigInt.fromI32(0));
  tempEntity.partner = null;
  tempEntity.save();
}

function loadNewExchangePartner(id: string): ExchangePartner {
  let newExchangePartner = new ExchangePartner(id);
  newExchangePartner.usdVolume = new BigDecimal(BigInt.fromI32(0));
  newExchangePartner.usdFees = new BigDecimal(BigInt.fromI32(0));
  newExchangePartner.trades = BigInt.fromI32(0);
  return newExchangePartner;
}

function updateExchangePartner(
  exchangePartner: ExchangePartner,
  usdVolume: BigDecimal,
  usdFees: BigDecimal
): void {
  exchangePartner.usdVolume = exchangePartner.usdVolume.plus(usdVolume);
  exchangePartner.usdFees = exchangePartner.usdFees.plus(usdFees);
  exchangePartner.trades = exchangePartner.trades.plus(BigInt.fromI32(1));
  exchangePartner.save();
}

function updateDailyExchangePartner(
  dailyExchangePartner: DailyExchangePartner,
  usdVolume: BigDecimal,
  usdFees: BigDecimal
): void {
  dailyExchangePartner.usdVolume =
    dailyExchangePartner.usdVolume.plus(usdVolume);
  dailyExchangePartner.usdFees = dailyExchangePartner.usdFees.plus(usdFees);
  dailyExchangePartner.trades = dailyExchangePartner.trades.plus(
    BigInt.fromI32(1)
  );
  dailyExchangePartner.save();
}

function loadNewDailyExchangePartner(
  id: string,
  partnerID: string,
  timestamp: BigInt
): DailyExchangePartner {
  let newDailyExchangePartner = new DailyExchangePartner(id);
  newDailyExchangePartner.partner = partnerID;
  newDailyExchangePartner.timestamp = timestamp;
  newDailyExchangePartner.usdVolume = new BigDecimal(BigInt.fromI32(0));
  newDailyExchangePartner.usdFees = new BigDecimal(BigInt.fromI32(0));
  newDailyExchangePartner.trades = BigInt.fromI32(0);
  return newDailyExchangePartner;
}

function getFeeUSDFromVolume(volume: BigDecimal, feeRate: BigInt): BigDecimal {
  let decimalFee = toDecimal(feeRate);
  return volume.times(decimalFee);
}

export function handleExchangeEntryAppended(
  event: ExchangeEntryAppendedEvent
): void {
  let txHash = event.transaction.hash.toHex();
  let entity = new ExchangeEntryAppended(
    txHash + "-" + event.logIndex.toString()
  );
  entity.account = event.params.account;
  entity.src = event.params.src;
  entity.amount = toDecimal(event.params.amount);
  entity.dest = event.params.dest;
  entity.amountReceived = toDecimal(event.params.amountReceived);
  entity.exchangeFeeRate = toDecimal(event.params.exchangeFeeRate);
  entity.roundIdForSrc = event.params.roundIdForSrc;
  entity.roundIdForDest = event.params.roundIdForDest;

  entity.save();

  if (
    dataSource.network() == "mainnet" &&
    event.block.number > partnerProgramStart &&
    event.block.number < exchangerContractUpdate
  ) {
    let synth = event.params.src.toString();
    let latestRate = LatestRate.load(synth);
    if (latestRate == null) {
      log.error(
        "handleExchangeEntryAppended rate missing for volume partner trade with synth: {}, and amount: {} in tx hash: {}",
        [synth, event.params.amount.toString(), txHash]
      );
      return;
    }

    let tempEntity = TemporaryExchangePartnerTracker.load(txHash);

    if (tempEntity == null) {
      tempEntity = createTempEntity(txHash);
    }

    let usdVolume = getUSDAmountFromAssetAmount(
      event.params.amount,
      latestRate.rate
    );
    let usdFees = getFeeUSDFromVolume(usdVolume, event.params.exchangeFeeRate);

    if (tempEntity.partner != null) {
      let exchangePartner = ExchangePartner.load(tempEntity.partner!);
      if (exchangePartner == null) {
        exchangePartner = loadNewExchangePartner(tempEntity.partner!);
      }
      updateExchangePartner(
        exchangePartner as ExchangePartner,
        usdVolume,
        usdFees
      );

      let timestamp = getTimeID(event.block.timestamp, DAY_SECONDS);
      let dailyExchangePartnerID =
        timestamp.toString() + "-" + tempEntity.partner!;
      let dailyExchangePartner = DailyExchangePartner.load(
        dailyExchangePartnerID
      );

      if (dailyExchangePartner == null) {
        dailyExchangePartner = loadNewDailyExchangePartner(
          dailyExchangePartnerID,
          tempEntity.partner!,
          timestamp
        );
      }

      updateDailyExchangePartner(
        dailyExchangePartner as DailyExchangePartner,
        usdVolume,
        usdFees
      );
      resetTempEntity(txHash);
    } else {
      tempEntity.usdVolume = usdVolume;
      tempEntity.usdFees = usdFees;
      tempEntity.save();
    }
  }
}

export function handleExchangeTrackingV1(event: ExchangeTrackingEventV1): void {
  let txHash = event.transaction.hash.toHex();
  let exchangePartnerID = event.params.trackingCode.toString();

  let tempEntity = TemporaryExchangePartnerTracker.load(txHash);

  if (tempEntity == null) {
    tempEntity = createTempEntity(txHash);
    tempEntity.partner = exchangePartnerID;
    tempEntity.save();
    return;
  }

  if (tempEntity != null && (!tempEntity.usdVolume || !tempEntity.usdFees)) {
    log.error(
      "handleExchangeTracking tempEntity exists but the volume and/ or rebate is null for txhash: {}, partner: {}",
      [txHash, exchangePartnerID]
    );
    return;
  }

  let exchangePartner = ExchangePartner.load(exchangePartnerID);
  if (exchangePartner == null) {
    exchangePartner = loadNewExchangePartner(exchangePartnerID);
  }
  updateExchangePartner(
    exchangePartner as ExchangePartner,
    tempEntity.usdVolume as BigDecimal,
    tempEntity.usdFees as BigDecimal
  );

  let timestamp = getTimeID(event.block.timestamp, DAY_SECONDS);
  let dailyExchangePartnerID = timestamp.toString() + "-" + exchangePartnerID;
  let dailyExchangePartner = DailyExchangePartner.load(dailyExchangePartnerID);
  if (dailyExchangePartner == null) {
    dailyExchangePartner = loadNewDailyExchangePartner(
      dailyExchangePartnerID,
      exchangePartnerID,
      timestamp
    );
  }

  updateDailyExchangePartner(
    dailyExchangePartner as DailyExchangePartner,
    tempEntity.usdVolume as BigDecimal,
    tempEntity.usdFees as BigDecimal
  );

  resetTempEntity(txHash);
}

export function handleExchangeTrackingV2(event: ExchangeTrackingEventV2): void {
  let txHash = event.transaction.hash.toHex();
  let synth = event.params.toCurrencyKey.toString();
  let latestRate = LatestRate.load(synth);
  if (latestRate == null) {
    log.error(
      "handleExchangeEntryAppended rate missing for volume partner trade with synth: {}, and amount: {} in tx hash: {}",
      [synth, event.params.toAmount.toString(), txHash]
    );
    return;
  }

  let exchangePartnerID = event.params.trackingCode.toString();
  let exchangePartner = ExchangePartner.load(exchangePartnerID);
  if (exchangePartner == null) {
    exchangePartner = loadNewExchangePartner(exchangePartnerID);
  }

  let usdVolume = getUSDAmountFromAssetAmount(
    event.params.toAmount,
    latestRate.rate
  );

  let fee = toDecimal(event.params.fee);

  updateExchangePartner(exchangePartner as ExchangePartner, usdVolume, fee);

  let timestamp = getTimeID(event.block.timestamp, DAY_SECONDS);
  let dailyExchangePartnerID = timestamp.toString() + "-" + exchangePartnerID;
  let dailyExchangePartner = DailyExchangePartner.load(dailyExchangePartnerID);
  if (dailyExchangePartner == null) {
    dailyExchangePartner = loadNewDailyExchangePartner(
      dailyExchangePartnerID,
      exchangePartnerID,
      timestamp
    );
  }

  updateDailyExchangePartner(
    dailyExchangePartner as DailyExchangePartner,
    usdVolume,
    fee
  );
}
