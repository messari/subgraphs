import {
  SynthExchange as SynthExchangeEvent,
  AtomicSynthExchange as AtomicSynthExchangeEvent,
  ExchangeReclaim as ExchangeReclaimEvent,
  ExchangeRebate as ExchangeRebateEvent,
} from "../../generated/exchanges_Synthetix_0/Synthetix";

import { PositionModified as PositionModifiedEvent } from "../../generated/exchanges_FuturesMarketManager_0/FuturesMarket";

import { MarketAdded as MarketAddedEvent } from "../../generated/exchanges_FuturesMarketManager_0/FuturesMarketManager";

import { FuturesMarketTemplate } from "../../generated/templates";

import { ExchangeRates } from "../../generated/ExchangeRates_13/ExchangeRates";

import { ExchangeFeeUpdated as ExchangeFeeUpdatedEvent } from "../../generated/exchanges_SystemSettings_0/SystemSettings";

import {
  Total,
  SynthExchange,
  AtomicSynthExchange,
  Exchanger,
  ExchangeReclaim,
  ExchangeRebate,
  ExchangeFee,
  SynthByCurrencyKey,
  FuturesMarket,
} from "../../generated/schema";

import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";

import {
  getUSDAmountFromAssetAmount,
  getLatestRate,
  DAY_SECONDS,
  getTimeID,
  FIFTEEN_MINUTE_SECONDS,
  strToBytes,
  ZERO,
  YEAR_SECONDS,
  getExchangeFee,
} from "./lib/helpers";
import { toDecimal, ZERO_ADDRESS } from "./lib/helpers";
import { addDollar, addProxyAggregator } from "./fragments/latest-rates";
import { Synthetix } from "../../generated/ChainlinkMultisig/Synthetix";
import { AddressResolver } from "../../generated/ChainlinkMultisig/AddressResolver";

const MAX_MAGNITUDE = 10;
const ETHER = BigInt.fromI32(10).pow(18);

function populateAggregatedTotalEntity(
  timestamp: BigInt,
  period: BigInt,
  product: string,
  bucketMagnitude: BigInt,
  synth: string | null
): Total {
  const synthName = synth && synth.length ? (synth as string) : "null";
  const id =
    timestamp.toString() +
    "-" +
    bucketMagnitude.toString() +
    "-" +
    synthName +
    "-" +
    period.toString() +
    "-" +
    product;

  let entity = Total.load(id);

  if (entity != null) {
    return entity;
  }

  entity = new Total(id);
  entity.timestamp = timestamp;
  entity.period = period;
  entity.bucketMagnitude = bucketMagnitude;
  entity.synth = synth;
  entity.product = product;

  entity.trades = ZERO;
  entity.exchangers = ZERO;
  entity.newExchangers = ZERO;
  entity.exchangeUSDTally = new BigDecimal(ZERO);
  entity.totalFeesGeneratedInUSD = new BigDecimal(ZERO);

  return entity;
}

function trackTotals(
  entity: Total,
  account: Address,
  actualTimestamp: BigInt,
  amountInUSD: BigDecimal,
  feesInUSD: BigDecimal
): void {
  let exchangerId = account.toHex();

  if (entity.period != ZERO) {
    exchangerId = account.toHex() + "-" + entity.id;
  }

  const globalExchanger = Exchanger.load(account.toHex());
  let exchanger = Exchanger.load(exchangerId);

  if (globalExchanger == null) {
    entity.newExchangers = entity.newExchangers.plus(BigInt.fromI32(1));
  }

  if (exchanger == null) {
    entity.exchangers = entity.exchangers.plus(BigInt.fromI32(1));

    exchanger = new Exchanger(exchangerId);
    exchanger.firstSeen = actualTimestamp;
    exchanger.timestamp = entity.timestamp;
    exchanger.period = entity.period;
    exchanger.bucketMagnitude = entity.bucketMagnitude;
    exchanger.synth = entity.synth;

    exchanger.trades = ZERO;
    exchanger.exchangeUSDTally = new BigDecimal(ZERO);
    exchanger.totalFeesGeneratedInUSD = new BigDecimal(ZERO);
  }

  exchanger.lastSeen = actualTimestamp;

  if (amountInUSD && feesInUSD) {
    entity.trades = entity.trades.plus(BigInt.fromI32(1));
    exchanger.trades = exchanger.trades.plus(BigInt.fromI32(1));

    entity.exchangeUSDTally = entity.exchangeUSDTally.plus(amountInUSD);
    entity.totalFeesGeneratedInUSD =
      entity.totalFeesGeneratedInUSD.plus(feesInUSD);

    exchanger.exchangeUSDTally = exchanger.exchangeUSDTally.plus(amountInUSD);
    exchanger.totalFeesGeneratedInUSD =
      exchanger.totalFeesGeneratedInUSD.plus(feesInUSD);
  }

  entity.save();
  exchanger.save();
}

function addMissingSynthRate(currencyBytes: Bytes): BigDecimal {
  if (
    currencyBytes.toString() == "sUSD" ||
    currencyBytes.toString() == "nUSD"
  ) {
    addDollar("sUSD");
    addDollar("nUSD");
    return toDecimal(BigInt.fromI32(1));
  }

  const snx = Synthetix.bind(dataSource.address());
  const snxResolver = snx.try_resolver();
  if (!snxResolver.reverted) {
    const resolver = AddressResolver.bind(snxResolver.value);
    const exchangeRatesContract = ExchangeRates.bind(
      resolver.getAddress(strToBytes("ExchangeRates"))
    );

    const aggregatorResult = exchangeRatesContract.aggregators(currencyBytes);

    if (aggregatorResult.equals(ZERO_ADDRESS)) {
      throw new Error(
        "aggregator does not exist in exchange rates for synth " +
          currencyBytes.toString()
      );
    }

    addProxyAggregator(currencyBytes.toString(), aggregatorResult);

    return toDecimal(exchangeRatesContract.rateForCurrency(currencyBytes));
  } else {
    return new BigDecimal(new BigInt(0));
  }
}

export function handleSynthExchange(event: SynthExchangeEvent): void {
  const txHash = event.transaction.hash.toHex();
  const fromCurrencyKey = event.params.fromCurrencyKey.toString();
  const toCurrencyKey = event.params.toCurrencyKey.toString();
  let latestFromRate = getLatestRate(fromCurrencyKey, txHash);
  let latestToRate = getLatestRate(toCurrencyKey, txHash);
  // this will ensure SNX rate gets added at some point
  const latestSNXRate = getLatestRate("SNX", txHash);
  if (!latestSNXRate) {
    addMissingSynthRate(strToBytes("SNX"));
  }

  // may need to add new aggregator (this can happen on optimism)
  if (!latestFromRate) {
    latestFromRate = addMissingSynthRate(event.params.fromCurrencyKey);
  }

  if (!latestToRate) {
    latestToRate = addMissingSynthRate(event.params.fromCurrencyKey);
  }

  const account = event.params.account;
  const fromAmountInUSD = getUSDAmountFromAssetAmount(
    event.params.fromAmount,
    latestFromRate
  );
  const toAmountInUSD = getUSDAmountFromAssetAmount(
    event.params.toAmount,
    latestToRate
  );

  const feesInUSD = fromAmountInUSD.times(
    getExchangeFee(
      "exchangeFeeRate",
      fromCurrencyKey == "sUSD" ? toCurrencyKey : fromCurrencyKey
    )
  );

  const fromSynth = SynthByCurrencyKey.load(fromCurrencyKey);
  const toSynth = SynthByCurrencyKey.load(toCurrencyKey);

  const fromSynthAddress =
    fromSynth != null ? fromSynth.proxyAddress : ZERO_ADDRESS;
  const toSynthAddress = toSynth != null ? toSynth.proxyAddress : ZERO_ADDRESS;

  const eventEntity = new SynthExchange(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  eventEntity.account = account.toHex();
  eventEntity.fromSynth = fromSynthAddress.toHex();
  eventEntity.toSynth = toSynthAddress.toHex();
  eventEntity.fromAmount = toDecimal(event.params.fromAmount);
  eventEntity.fromAmountInUSD = fromAmountInUSD;
  eventEntity.toAmount = toDecimal(event.params.toAmount);
  eventEntity.toAmountInUSD = toAmountInUSD;
  eventEntity.toAddress = event.params.toAddress;
  eventEntity.feesInUSD = feesInUSD;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.gasPrice = event.transaction.gasPrice;
  eventEntity.save();

  const synthOpts: (string | null)[] = [
    null,
    fromSynthAddress.toHex(),
    toSynthAddress.toHex(),
  ];

  const periods: BigInt[] = [
    YEAR_SECONDS,
    YEAR_SECONDS.div(BigInt.fromI32(4)),
    YEAR_SECONDS.div(BigInt.fromI32(12)),
    DAY_SECONDS.times(BigInt.fromI32(7)),
    DAY_SECONDS,
    FIFTEEN_MINUTE_SECONDS,
    ZERO,
  ];

  for (let s = 0; s < synthOpts.length; s++) {
    const synth = synthOpts[s];

    for (let p = 0; p < periods.length; p++) {
      const period = periods[p];
      const startTimestamp =
        period == ZERO ? ZERO : getTimeID(event.block.timestamp, period);

      for (let m = 0; m < MAX_MAGNITUDE; m++) {
        const mag = new BigDecimal(
          BigInt.fromI32(<i32>Math.floor(Math.pow(10, m)))
        );
        if (fromAmountInUSD.lt(mag)) {
          break;
        }

        trackTotals(
          populateAggregatedTotalEntity(
            startTimestamp,
            period,
            "exchange",
            BigInt.fromI32(m),
            synth
          ),
          account,
          event.block.timestamp,
          fromAmountInUSD,
          feesInUSD
        );
      }
    }
  }
}

export function handleAtomicSynthExchange(
  event: AtomicSynthExchangeEvent
): void {
  const txHash = event.transaction.hash.toHex();
  const fromCurrencyKey = event.params.fromCurrencyKey.toString();
  const toCurrencyKey = event.params.toCurrencyKey.toString();
  let latestFromRate = getLatestRate(fromCurrencyKey, txHash);
  let latestToRate = getLatestRate(toCurrencyKey, txHash);

  // may need to add new aggregator (this can happen on optimism)
  if (!latestFromRate) {
    latestFromRate = addMissingSynthRate(event.params.fromCurrencyKey);
  }

  if (!latestToRate) {
    latestToRate = addMissingSynthRate(event.params.fromCurrencyKey);
  }

  const account = event.params.account;
  const fromAmountInUSD = getUSDAmountFromAssetAmount(
    event.params.fromAmount,
    latestFromRate
  );
  const toAmountInUSD = getUSDAmountFromAssetAmount(
    event.params.toAmount,
    latestToRate
  );

  const fromSynth = SynthByCurrencyKey.load(fromCurrencyKey);
  const toSynth = SynthByCurrencyKey.load(toCurrencyKey);

  const feesInUSD = fromAmountInUSD.times(
    getExchangeFee(
      "atomicExchangeFeeRate",
      fromCurrencyKey == "sUSD" ? toCurrencyKey : fromCurrencyKey
    )
  );

  const fromSynthAddress =
    fromSynth != null ? fromSynth.proxyAddress : ZERO_ADDRESS;
  const toSynthAddress = toSynth != null ? toSynth.proxyAddress : ZERO_ADDRESS;

  const eventEntity = new AtomicSynthExchange(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  eventEntity.account = account.toHex();
  eventEntity.fromSynth = fromSynthAddress.toHex();
  eventEntity.toSynth = toSynthAddress.toHex();
  eventEntity.fromAmount = toDecimal(event.params.fromAmount);
  eventEntity.fromAmountInUSD = fromAmountInUSD;
  eventEntity.toAmount = toDecimal(event.params.toAmount);
  eventEntity.toAmountInUSD = toAmountInUSD;
  eventEntity.toAddress = event.params.toAddress;
  eventEntity.feesInUSD = feesInUSD;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.gasPrice = event.transaction.gasPrice;
  eventEntity.save();
  // Note that we do not update tracked totals here because atomic exchanges also emit standard SynthExchange events
}

export function handleExchangeReclaim(event: ExchangeReclaimEvent): void {
  const txHash = event.transaction.hash.toHex();
  const entity = new ExchangeReclaim(txHash + "-" + event.logIndex.toString());
  entity.account = event.params.account.toHex();
  entity.amount = toDecimal(event.params.amount);
  entity.currencyKey = event.params.currencyKey;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  const latestRate = getLatestRate(event.params.currencyKey.toString(), txHash);

  if (!latestRate) {
    log.error("handleExchangeReclaim has an issue in tx hash: {}", [txHash]);
    return;
  }
  entity.amountInUSD = getUSDAmountFromAssetAmount(
    event.params.amount,
    latestRate
  );
  entity.save();
}

export function handleExchangeRebate(event: ExchangeRebateEvent): void {
  const txHash = event.transaction.hash.toHex();
  const entity = new ExchangeRebate(txHash + "-" + event.logIndex.toString());
  entity.account = event.params.account.toHex();
  entity.amount = toDecimal(event.params.amount);
  entity.currencyKey = event.params.currencyKey;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;
  const latestRate = getLatestRate(event.params.currencyKey.toString(), txHash);

  if (!latestRate) {
    log.error("handleExchangeReclaim has an issue in tx hash: {}", [txHash]);
    return;
  }
  entity.amountInUSD = getUSDAmountFromAssetAmount(
    event.params.amount,
    latestRate
  );
  entity.save();
}

export function handleFeeChange(event: ExchangeFeeUpdatedEvent): void {
  const currencyKey = event.params.synthKey.toString();

  const entity = new ExchangeFee(currencyKey);
  entity.fee = toDecimal(event.params.newExchangeFeeRate);
  entity.save();
}

export function handleMarketAdded(event: MarketAddedEvent): void {
  const market = FuturesMarket.load(event.params.market.toHexString());
  if (!market) {
    FuturesMarketTemplate.create(event.params.market);
  }
}

export function handlePositionModified(event: PositionModifiedEvent): void {
  const market = event.transaction.to!.toHex();

  const periods: BigInt[] = [
    YEAR_SECONDS,
    YEAR_SECONDS.div(BigInt.fromI32(4)),
    YEAR_SECONDS.div(BigInt.fromI32(12)),
    DAY_SECONDS.times(BigInt.fromI32(7)),
    DAY_SECONDS,
    FIFTEEN_MINUTE_SECONDS,
    ZERO,
  ];

  const amountInUSD = toDecimal(
    event.params.tradeSize.times(event.params.lastPrice).div(ETHER).abs()
  );

  const synthOpts: (string | null)[] = [null, market];

  for (let s = 0; s < synthOpts.length; s++) {
    const synth = synthOpts[s];

    for (let p = 0; p < periods.length; p++) {
      const period = periods[p];
      const startTimestamp =
        period == ZERO ? ZERO : getTimeID(event.block.timestamp, period);

      for (let m = 0; m < MAX_MAGNITUDE; m++) {
        const mag = new BigDecimal(
          BigInt.fromI32(<i32>Math.floor(Math.pow(10, m)))
        );
        if (amountInUSD.lt(mag)) {
          break;
        }

        trackTotals(
          populateAggregatedTotalEntity(
            startTimestamp,
            period,
            "futures",
            BigInt.fromI32(m),
            synth
          ),
          event.params.account,
          event.block.timestamp,
          amountInUSD,
          toDecimal(event.params.fee)
        );
      }
    }
  }
}
