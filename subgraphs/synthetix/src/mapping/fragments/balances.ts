import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  Synth as SynthContract,
  Transfer as SynthTransferEvent,
} from "../../../generated/balances_SynthsUSD_0/Synth";

import {
  Synth,
  SynthBalance,
  LatestSynthBalance,
  SynthByCurrencyKey,
} from "../../../generated/schema";
import { toDecimal, ZERO, ZERO_ADDRESS } from "../lib/helpers";

export function registerSynth(synthAddress: Address): Synth | null {
  // the address associated with the issuer may not be the proxy
  const synthBackContract = SynthContract.bind(synthAddress);
  const proxyQuery = synthBackContract.try_proxy();
  const nameQuery = synthBackContract.try_name();
  const symbolQuery = synthBackContract.try_symbol();
  const totalSupplyQuery = synthBackContract.try_totalSupply();

  if (symbolQuery.reverted) {
    log.warning("tried to save invalid synth {}", [synthAddress.toHex()]);
    return null;
  }

  if (!proxyQuery.reverted) {
    synthAddress = proxyQuery.value;
  }

  const newSynth = new Synth(synthAddress.toHex());
  newSynth.name = nameQuery.reverted ? symbolQuery.value : nameQuery.value;
  newSynth.symbol = symbolQuery.value;
  newSynth.totalSupply = toDecimal(totalSupplyQuery.value);
  newSynth.save();

  // symbol is same as currencyKey
  const newSynthByCurrencyKey = new SynthByCurrencyKey(symbolQuery.value);
  newSynthByCurrencyKey.proxyAddress = synthAddress;
  newSynthByCurrencyKey.save();

  // legacy sUSD contract uses wrong name
  if (symbolQuery.value == "nUSD") {
    const newSynthByCurrencyKey = new SynthByCurrencyKey("sUSD");
    newSynthByCurrencyKey.proxyAddress = synthAddress;
    newSynthByCurrencyKey.save();
  }

  return newSynth;
}

function trackSynthHolder(
  synthAddress: Address,
  account: Address,
  timestamp: BigInt,
  value: BigDecimal
): void {
  const synth = Synth.load(synthAddress.toHex());

  if (synth == null) {
    registerSynth(synthAddress);
  }

  let totalBalance = toDecimal(ZERO);
  const latestBalanceID = account.toHex() + "-" + synthAddress.toHex();
  const oldSynthBalance = LatestSynthBalance.load(latestBalanceID);

  if (oldSynthBalance == null || oldSynthBalance.timestamp.equals(timestamp)) {
    totalBalance = toDecimal(
      SynthContract.bind(synthAddress).balanceOf(account)
    );
  } else {
    totalBalance = oldSynthBalance.amount.plus(value);
  }

  const newLatestBalance = new LatestSynthBalance(latestBalanceID);
  newLatestBalance.address = account;
  newLatestBalance.account = account.toHex();
  newLatestBalance.timestamp = timestamp;
  newLatestBalance.synth = synthAddress.toHex();
  newLatestBalance.amount = totalBalance;
  newLatestBalance.save();

  const newBalanceID =
    timestamp.toString() + "-" + account.toHex() + "-" + synthAddress.toHex();
  const newBalance = new SynthBalance(newBalanceID);
  newBalance.address = account;
  newBalance.account = account.toHex();
  newBalance.timestamp = timestamp;
  newBalance.synth = synthAddress.toHex();
  newBalance.amount = totalBalance;
  newBalance.save();
}

function trackMintOrBurn(synthAddress: Address, value: BigDecimal): void {
  let synth = Synth.load(synthAddress.toHex());

  if (synth == null) {
    synth = registerSynth(synthAddress);
  }

  if (synth != null) {
    let newSupply = value;
    if (synth.totalSupply) {
      newSupply = synth.totalSupply!.plus(value);
    }
    if (newSupply.lt(toDecimal(ZERO))) {
      log.warning("totalSupply needs correction, is negative: %s", [
        synth.symbol,
      ]);
      const synthBackContract = SynthContract.bind(synthAddress);
      synth.totalSupply = toDecimal(synthBackContract.totalSupply());
    } else {
      synth.totalSupply = newSupply;
    }

    synth.save();
  }
}

export function handleTransferSynth(event: SynthTransferEvent): void {
  if (
    event.params.from.toHex() != ZERO_ADDRESS.toHex() &&
    event.params.from != event.address
  ) {
    trackSynthHolder(
      event.address,
      event.params.from,
      event.block.timestamp,
      toDecimal(event.params.value).neg()
    );
  } else {
    trackMintOrBurn(event.address, toDecimal(event.params.value));
  }

  if (
    event.params.to.toHex() != ZERO_ADDRESS.toHex() &&
    event.params.to != event.address
  ) {
    trackSynthHolder(
      event.address,
      event.params.to,
      event.block.timestamp,
      toDecimal(event.params.value)
    );
  } else {
    trackMintOrBurn(event.address, toDecimal(event.params.value).neg());
  }
}
