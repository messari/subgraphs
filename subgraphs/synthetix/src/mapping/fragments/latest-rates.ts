import {
  RatesUpdated as RatesUpdatedEvent,
  AggregatorAdded as AggregatorAddedEvent,
  InversePriceConfigured,
  InversePriceFrozen,
  ExchangeRates,
} from "../../../generated/ExchangeRates_0/ExchangeRates";

import {
  AggregatorProxy as AggregatorProxyContract,
  AggregatorConfirmed as AggregatorConfirmedEvent,
} from "../../../generated/ExchangeRates_0/AggregatorProxy";

import {
  ExchangeFeeUpdated,
  AtomicExchangeFeeUpdated,
  SystemSettings,
} from "../../../generated/latestRates-SystemSettings_0/SystemSettings";

import { AnswerUpdated as AnswerUpdatedEvent } from "../../../generated/templates/Aggregator/Aggregator";

import {
  AggregatorProxy,
  SynthAggregatorProxy,
  InverseAggregatorProxy,
  Aggregator,
  SynthAggregator,
  InverseAggregator,
} from "../../../generated/templates";
import {
  LatestRate,
  InversePricingInfo,
  RateUpdate,
  FeeRate,
  DailyCandle,
  Candle,
} from "../../../generated/schema";

import {
  BigDecimal,
  BigInt,
  DataSourceContext,
  dataSource,
  log,
  Address,
  ethereum,
  Bytes,
} from "@graphprotocol/graph-ts";

import {
  strToBytes,
  toDecimal,
  ZERO,
  ZERO_ADDRESS,
  CANDLE_PERIODS,
} from "../lib/helpers";
import { ExecutionSuccess } from "../../../generated/templates/InverseAggregator/GnosisSafe";
import { AddressResolver } from "../../../generated/templates/Aggregator/AddressResolver";
import { getContractDeployment } from "../../../protocols/addresses";

export function addLatestRate(
  synth: string,
  rate: BigInt,
  aggregator: Address,
  event: ethereum.Event
): void {
  const decimalRate = toDecimal(rate);
  addLatestRateFromDecimal(synth, decimalRate, aggregator, event);
}

export function addLatestRateFromDecimal(
  synth: string,
  rate: BigDecimal,
  aggregator: Address,
  event: ethereum.Event
): void {
  let prevLatestRate = LatestRate.load(synth);
  if (prevLatestRate != null && aggregator.notEqual(prevLatestRate.aggregator))
    return;

  if (prevLatestRate == null) {
    prevLatestRate = new LatestRate(synth);
    prevLatestRate.aggregator = aggregator;
  }

  prevLatestRate.rate = rate;
  prevLatestRate.save();

  const rateUpdate = new RateUpdate(
    event.transaction.hash.toHex() + "-" + synth
  );
  rateUpdate.currencyKey = strToBytes(synth);
  rateUpdate.synth = synth;
  rateUpdate.rate = rate;
  rateUpdate.block = event.block.number;
  rateUpdate.timestamp = event.block.timestamp;
  rateUpdate.save();

  updateDailyCandle(event.block.timestamp, synth, rate); // DEPRECATED: See updateCandle
  updateCandle(event.block.timestamp, synth, rate);
}

function updateCandle(
  timestamp: BigInt,
  synth: string,
  rate: BigDecimal
): void {
  for (let p = 0; p < CANDLE_PERIODS.length; p++) {
    const period = CANDLE_PERIODS[p];
    const periodId = timestamp.div(period);
    const id = synth + "-" + period.toString() + "-" + periodId.toString();
    let candle = Candle.load(id);
    if (candle == null) {
      candle = new Candle(id);
      candle.synth = synth;
      candle.open = rate;
      candle.high = rate;
      candle.low = rate;
      candle.close = rate;
      candle.average = rate;
      candle.period = period;
      candle.timestamp = timestamp.minus(timestamp.mod(period)); // store the beginning of this period, rather than the timestamp of the first rate update.
      candle.aggregatedPrices = BigInt.fromI32(1);
      candle.save();
      return;
    }

    if (candle.low > rate) {
      candle.low = rate;
    }
    if (candle.high < rate) {
      candle.high = rate;
    }
    candle.close = rate;
    candle.average = calculateAveragePrice(
      candle.average,
      rate,
      candle.aggregatedPrices
    );
    candle.aggregatedPrices = candle.aggregatedPrices.plus(BigInt.fromI32(1));

    candle.save();
  }
}

function calculateAveragePrice(
  oldAveragePrice: BigDecimal,
  newRate: BigDecimal,
  oldAggregatedPrices: BigInt
): BigDecimal {
  return oldAveragePrice
    .times(oldAggregatedPrices.toBigDecimal())
    .plus(newRate)
    .div(oldAggregatedPrices.plus(BigInt.fromI32(1)).toBigDecimal());
}

export function addDollar(dollarID: string): void {
  const dollarRate = new LatestRate(dollarID);
  dollarRate.rate = new BigDecimal(BigInt.fromI32(1));
  dollarRate.aggregator = ZERO_ADDRESS;
  dollarRate.save();
}

export function addProxyAggregator(
  currencyKey: string,
  aggregatorProxyAddress: Address
): void {
  const proxy = AggregatorProxyContract.bind(aggregatorProxyAddress);
  const underlyingAggregator = proxy.try_aggregator();

  if (!underlyingAggregator.reverted) {
    const context = new DataSourceContext();
    context.setString("currencyKey", currencyKey);

    log.info("adding proxy aggregator for synth {}", [currencyKey]);

    if (currencyKey.startsWith("s")) {
      SynthAggregatorProxy.createWithContext(aggregatorProxyAddress, context);
    } else if (currencyKey.startsWith("i")) {
      InverseAggregatorProxy.createWithContext(aggregatorProxyAddress, context);
    } else {
      AggregatorProxy.createWithContext(aggregatorProxyAddress, context);
    }

    addAggregator(currencyKey, underlyingAggregator.value);
  } else {
    addAggregator(currencyKey, aggregatorProxyAddress);
  }
}

export function addAggregator(
  currencyKey: string,
  aggregatorAddress: Address
): void {
  // check current aggregator address, and don't add again if its same
  const latestRate = LatestRate.load(currencyKey);

  log.info("adding aggregator for synth {}", [currencyKey]);

  if (latestRate != null) {
    if (aggregatorAddress.equals(latestRate.aggregator)) {
      return;
    }

    latestRate.aggregator = aggregatorAddress;
    latestRate.save();
  }

  const context = new DataSourceContext();
  context.setString("currencyKey", currencyKey);

  if (currencyKey.startsWith("s")) {
    SynthAggregator.createWithContext(aggregatorAddress, context);
  } else if (currencyKey.startsWith("i")) {
    InverseAggregator.createWithContext(aggregatorAddress, context);
  } else {
    Aggregator.createWithContext(aggregatorAddress, context);
  }
}

export function calculateInverseRate(
  currencyKey: string,
  beforeRate: BigDecimal
): BigDecimal {
  // since this is inverse pricing, we have to get the latest token information and then apply it to the rate
  const inversePricingInfo = InversePricingInfo.load(currencyKey);

  if (inversePricingInfo == null) {
    log.warning("Missing inverse pricing info for asset {}", [currencyKey]);
    return toDecimal(ZERO);
  }

  if (inversePricingInfo.frozen) return toDecimal(ZERO);

  let inverseRate = inversePricingInfo.entryPoint
    .times(new BigDecimal(BigInt.fromI32(2)))
    .minus(beforeRate);

  inverseRate = inversePricingInfo.lowerLimit.lt(inverseRate)
    ? inverseRate
    : inversePricingInfo.lowerLimit;
  inverseRate = inversePricingInfo.upperLimit.gt(inverseRate)
    ? inverseRate
    : inversePricingInfo.upperLimit;

  return inverseRate;
}

export function initFeed(currencyKey: string): BigDecimal | null {
  const addressResolverAddress = getContractDeployment(
    "AddressResolver",
    dataSource.network(),
    BigInt.fromI32(1000000000)
  )!;
  const resolver = AddressResolver.bind(addressResolverAddress);
  const exchangeRateAddressTry = resolver.try_getAddress(
    strToBytes("ExchangeRates", 32)
  );

  if (!exchangeRateAddressTry.reverted) {
    const er = ExchangeRates.bind(exchangeRateAddressTry.value);

    const aggregatorAddress = er.try_aggregators(strToBytes(currencyKey, 32));

    if (!aggregatorAddress.reverted) {
      addProxyAggregator(currencyKey, aggregatorAddress.value);

      const r = er.try_rateForCurrency(strToBytes(currencyKey, 32));

      if (!r.reverted) {
        return toDecimal(r.value);
      }
    }
  }

  return null;
}

export function initFeeRate(type: string, currencyKey: string): BigDecimal {
  const addressResolverAddress = getContractDeployment(
    "AddressResolver",
    dataSource.network(),
    BigInt.fromI32(1000000000)
  )!;

  const resolver = AddressResolver.bind(addressResolverAddress);
  const systemSettingsAddressTry = resolver.try_getAddress(
    strToBytes("SystemSettings", 32)
  );

  if (!systemSettingsAddressTry.reverted) {
    const ss = SystemSettings.bind(systemSettingsAddressTry.value);

    let result = ss.try_atomicExchangeFeeRate(strToBytes(currencyKey, 32));
    if (type === "exchangeFeeRate") {
      result = ss.try_exchangeFeeRate(strToBytes(currencyKey, 32));
      // eslint-disable-next-line no-empty
    } else if (type === "atomicExchangeFeeRate") {
    } else {
      log.warning("unknown fee type {}", [type]);
      return toDecimal(BigInt.fromI32(0));
    }

    if (!result.reverted) {
      const entity = new FeeRate(type + "-" + currencyKey);
      entity.setting = type;
      entity.synth = currencyKey;
      entity.rate = toDecimal(result.value);
      entity.save();

      return toDecimal(result.value);
    }
  }

  return toDecimal(BigInt.fromI32(0));
}

export function handleAggregatorAdded(event: AggregatorAddedEvent): void {
  addProxyAggregator(
    event.params.currencyKey.toString(),
    event.params.aggregator
  );
}

export function handleAggregatorProxyAddressUpdated(
  event: AggregatorConfirmedEvent
): void {
  const context = dataSource.context();
  addAggregator(context.getString("currencyKey"), event.params.latest);
}

export function handleRatesUpdated(event: RatesUpdatedEvent): void {
  addDollar("sUSD");
  addDollar("nUSD");

  const keys = event.params.currencyKeys;
  const rates = event.params.newRates;

  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toString() != "") {
      addLatestRate(keys[i].toString(), rates[i], ZERO_ADDRESS, event);
    }
  }
}

export function handleInverseConfigured(event: InversePriceConfigured): void {
  const entity = new InversePricingInfo(event.params.currencyKey.toString());
  entity.entryPoint = toDecimal(event.params.entryPoint);
  entity.lowerLimit = toDecimal(event.params.lowerLimit);
  entity.upperLimit = toDecimal(event.params.upperLimit);

  entity.frozen = false;

  entity.save();
}

export function handleInverseFrozen(event: InversePriceFrozen): void {
  const entity = new InversePricingInfo(event.params.currencyKey.toString());
  entity.frozen = true;
  entity.save();

  const curInverseRate = LatestRate.load(event.params.currencyKey.toString());

  if (!curInverseRate) return;

  addLatestRate(
    event.params.currencyKey.toString(),
    event.params.rate,
    changetype<Address>(curInverseRate.aggregator),
    event
  );
}

export function handleAggregatorAnswerUpdated(event: AnswerUpdatedEvent): void {
  const context = dataSource.context();
  const rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  addDollar("sUSD");
  addLatestRate(context.getString("currencyKey"), rate, event.address, event);
}

export function handleInverseAggregatorAnswerUpdated(
  event: AnswerUpdatedEvent
): void {
  const context = dataSource.context();
  const rate = event.params.current.times(BigInt.fromI32(10).pow(10));

  const inverseRate = calculateInverseRate(
    context.getString("currencyKey"),
    toDecimal(rate)
  );

  if (inverseRate.equals(toDecimal(ZERO))) return;

  addLatestRateFromDecimal(
    context.getString("currencyKey"),
    inverseRate as BigDecimal,
    event.address,
    event
  );
}

// required to rescan all aggregator addresses whenever chainlink settings are updated. This is because of an issue where the chainlink aggregator proxy
// does not contain an event to track when the aggregator addresses are updated, which means we must scan them manually when it makes sense to do so
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleChainlinkUpdate(event: ExecutionSuccess): void {
  const addressResolverAddress = getContractDeployment(
    "AddressResolver",
    dataSource.network(),
    BigInt.fromI32(1000000000)
  )!;
  //let synthetixAddress = synthetixProxyContract.try_target();

  /*if (synthetixAddress.reverted) {
    log.warning('snx base contract not available', []);
    return;
  }

  let synthetixContract = Synthetix.bind(synthetixAddress.value);

  let resolverAddress = synthetixContract.try_resolver();

  if (resolverAddress.reverted) {
    log.warning('snx resolver not available', []);
    return;
  }*/

  const resolverContract = AddressResolver.bind(addressResolverAddress);
  const ratesAddress = resolverContract.try_getAddress(
    strToBytes("ExchangeRates")
  );

  if (ratesAddress.reverted) {
    log.warning("could not get exchangerates address from resolver", []);
    return;
  }

  const ratesContract = ExchangeRates.bind(ratesAddress.value);

  let aggregatorKey: ethereum.CallResult<Bytes>;
  let index = 0;
  do {
    aggregatorKey = ratesContract.try_aggregatorKeys(BigInt.fromI32(index++));

    if (!aggregatorKey.reverted) {
      const aggregatorAddress = ratesContract.try_aggregators(
        aggregatorKey.value
      );

      if (!aggregatorAddress.reverted) {
        addProxyAggregator(
          aggregatorKey.value.toString(),
          aggregatorAddress.value
        );
      }
    }
  } while (!aggregatorKey.reverted);

  if (index == 0) {
    log.warning(
      "no aggregator keys found in rates contract for chainlink update, or reverted",
      []
    );
  }
}

export function handleExchangeFeeUpdated(event: ExchangeFeeUpdated): void {
  const entity = new FeeRate(
    "exchangeFeeRate-" + event.params.synthKey.toString()
  );
  entity.setting = "exchangeFee";
  entity.synth = event.params.synthKey.toString();
  entity.rate = toDecimal(event.params.newExchangeFeeRate);
  entity.save();
  return;
}

export function handleAtomicExchangeFeeUpdated(
  event: AtomicExchangeFeeUpdated
): void {
  const entity = new FeeRate(
    "atomicExchangeFeeRate-" + event.params.synthKey.toString()
  );
  entity.setting = "atomicExchangeFeeRate";
  entity.synth = event.params.synthKey.toString();
  entity.rate = toDecimal(event.params.newExchangeFeeRate);
  entity.save();
  return;
}

// DEPRECATED: See updateCandle
function updateDailyCandle(
  timestamp: BigInt,
  synth: string,
  rate: BigDecimal
): void {
  const dayID = timestamp.toI32() / 86400;
  let newCandle = DailyCandle.load(dayID.toString() + "-" + synth);
  if (newCandle == null) {
    newCandle = new DailyCandle(dayID.toString() + "-" + synth);
    newCandle.synth = synth;
    newCandle.open = rate;
    newCandle.high = rate;
    newCandle.low = rate;
    newCandle.close = rate;
    newCandle.timestamp = timestamp;
    newCandle.save();
    return;
  }
  if (newCandle.low > rate) {
    newCandle.low = rate;
  }
  if (newCandle.high < rate) {
    newCandle.high = rate;
  }
  newCandle.close = rate;
  newCandle.save();
}
