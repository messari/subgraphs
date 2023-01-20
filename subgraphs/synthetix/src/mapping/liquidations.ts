import { Synthetix32 } from "../../generated/liquidations_Liquidations_0/Synthetix32";

import { AddressResolver } from "../../generated/liquidations_Liquidations_0/AddressResolver";

import {
  AccountFlaggedForLiquidation as AccountFlaggedForLiquidationEvent,
  AccountRemovedFromLiquidation as AccountRemovedFromLiquidationEvent,
  Liquidations,
} from "../../generated/liquidations_Liquidations_0/Liquidations";

import { AccountLiquidated as AccountLiquidatedEvent } from "../../generated/liquidations_Synthetix_0/Synthetix";

import {
  AccountFlaggedForLiquidation,
  AccountRemovedFromLiquidation,
  AccountLiquidated,
} from "../../generated/schema";

import {
  bigDecimalToBigInt,
  getLatestRate,
  strToBytes,
  toDecimal,
} from "./lib/helpers";

import { BigInt } from "@graphprotocol/graph-ts";
import { SNX_ADDRESS, sUSD_ADDRESS } from "../utils/constants";
import { createLiquidate } from "../entities/event";
import { getOrCreateMarket, addMarketTokenBalance } from "../entities/market";
import { getOrCreateToken } from "../entities/token";

export function handleAccountFlaggedForLiquidation(
  event: AccountFlaggedForLiquidationEvent
): void {
  const liquidationsContract = Liquidations.bind(event.address);
  const resolver = AddressResolver.bind(liquidationsContract.resolver());
  const synthetix = Synthetix32.bind(
    resolver.getAddress(strToBytes("Synthetix", 32))
  );
  const accountFlaggedForLiquidation = new AccountFlaggedForLiquidation(
    event.params.deadline.toString() + "-" + event.params.account.toHex()
  );
  accountFlaggedForLiquidation.account = event.params.account;
  accountFlaggedForLiquidation.deadline = event.params.deadline;
  accountFlaggedForLiquidation.collateralRatio =
    synthetix.collateralisationRatio(event.params.account);
  accountFlaggedForLiquidation.collateral = toDecimal(
    synthetix.collateral(event.params.account)
  );
  accountFlaggedForLiquidation.liquidatableNonEscrowSNX = toDecimal(
    synthetix.balanceOf(event.params.account)
  );
  accountFlaggedForLiquidation.save();
}

export function handleAccountRemovedFromLiquidation(
  event: AccountRemovedFromLiquidationEvent
): void {
  const accountRemovedFromLiquidation = new AccountRemovedFromLiquidation(
    event.params.time.toString() + "-" + event.params.account.toHex()
  );
  accountRemovedFromLiquidation.account = event.params.account;
  accountRemovedFromLiquidation.time = event.params.time;
  accountRemovedFromLiquidation.save();
}

export function handleAccountLiquidated(event: AccountLiquidatedEvent): void {
  const entity = new AccountLiquidated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );

  entity.account = event.params.account;
  entity.snxRedeemed = toDecimal(event.params.snxRedeemed);
  entity.amountLiquidated = toDecimal(event.params.amountLiquidated);
  entity.liquidator = event.params.liquidator;
  entity.time = event.block.timestamp;

  entity.save();

  const address = event.params.account;
  const market = getOrCreateMarket(SNX_ADDRESS, event);
  const liquidator = event.params.liquidator;

  const snx = getOrCreateToken(SNX_ADDRESS);
  const snx_latestRate = getLatestRate("snx", event.transaction.hash.toHex());
  const snx_amount = toDecimal(event.params.snxRedeemed);
  const snx_amountUSD = snx_amount.times(snx_latestRate!);

  const susd = getOrCreateToken(sUSD_ADDRESS);
  const susd_latestRate = getLatestRate("sUSD", event.transaction.hash.toHex());
  const susd_amount = toDecimal(event.params.amountLiquidated);
  const susd_amountUSD = susd_amount.times(susd_latestRate!);

  const profitUSD = snx_amountUSD.minus(susd_amountUSD);

  createLiquidate(
    event,
    market,
    susd,
    bigDecimalToBigInt(susd_amount),
    bigDecimalToBigInt(snx_amount),
    susd_amountUSD,
    address,
    liquidator,
    profitUSD
  );
  addMarketTokenBalance(
    event,
    market,
    bigDecimalToBigInt(snx_amount).times(BigInt.fromString("-1")),
    snx_latestRate!
  );
}
