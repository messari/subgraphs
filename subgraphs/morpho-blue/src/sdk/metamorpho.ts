import { Address, BigDecimal, Bytes, log } from "@graphprotocol/graph-ts";

import {
  InterestRate,
  MetaMorpho,
  MetaMorphoMarket,
} from "../../generated/schema";
import { getMarket } from "../initializers/markets";
import { toAssetsDown } from "../maths/shares";

import { AccountManager } from "./account";
import { PositionSide } from "./constants";
import { PositionManager } from "./position";

export namespace PendingValueStatus {
  export const PENDING = "PENDING";
  export const ACCEPTED = "ACCEPTED";
  export const REJECTED = "REJECTED";

  export const OVERRIDDEN = "OVERRIDDEN";
}

export namespace QueueType {
  export const SUPPLY_QUEUE = "SUPPLY_QUEUE";
  export const WITHDRAW_QUEUE = "WITHDRAW_QUEUE";
}

export function loadMetaMorpho(address: Address): MetaMorpho {
  const mm = MetaMorpho.load(address);
  if (!mm) {
    log.critical("MetaMorpho {} not found", [address.toHexString()]);
  }
  return mm!;
}
export function loadMetaMorphoMarketFromId(id: Bytes): MetaMorphoMarket {
  const mmMarket = MetaMorphoMarket.load(id);
  if (!mmMarket) {
    log.critical("MetaMorphoMarket {} not found", [id.toHexString()]);
  }
  return mmMarket!;
}
export function loadMetaMorphoMarket(
  address: Address,
  marketId: Bytes
): MetaMorphoMarket {
  const mmMarket = MetaMorphoMarket.load(address.concat(marketId));
  if (!mmMarket) {
    log.critical("MetaMorphoMarket {} not found", [
      address.concat(marketId).toHexString(),
    ]);
  }
  return mmMarket!;
}
export function updateMMRate(address: Address): void {
  const mm = loadMetaMorpho(address);
  // TODO: idle will be removed soon, so not implemented here.
  // it will be defined with a market with a 0 supply rate
  let accumulator = BigDecimal.zero();
  let total = BigDecimal.zero();
  for (let i = 0; i < mm.withdrawQueue.length; i++) {
    const mmMarket = MetaMorphoMarket.load(mm.withdrawQueue[i]);
    if (!mmMarket) {
      log.critical("MetaMorphoMarket {} not found", [
        mm.withdrawQueue[i].toHexString(),
      ]);
      return;
    }

    const market = getMarket(mmMarket.market);
    if (!market.rates || !market.rates![0]) {
      log.critical("Market {} has no supply rate", [
        mmMarket.market.toHexString(),
      ]);
    }
    const marketSupplyRate = InterestRate.load(market.rates![0]);
    if (!marketSupplyRate) {
      log.critical("Market {} has no supply rate", [
        mmMarket.market.toHexString(),
      ]);
    }
    const positionManager = new PositionManager(
      new AccountManager(address).getAccount(),
      market,
      PositionSide.SUPPLIER
    );
    const currentPosition = positionManager.getPosition();

    if (currentPosition && currentPosition.shares) {
      const totalSupply = toAssetsDown(
        currentPosition.shares!,
        market.totalSupplyShares,
        market.totalSupply
      );
      accumulator = accumulator.plus(
        totalSupply.toBigDecimal().times(marketSupplyRate!.rate)
      );
      total = total.plus(totalSupply.toBigDecimal());
    }
  }
  if (total.equals(BigDecimal.zero())) {
    return;
  }
  const weightedRate = accumulator.div(total);

  const rate = InterestRate.load(mm.rate);
  if (!rate) {
    log.critical("InterestRate {} not found", [mm.rate]);
    return;
  }
  rate.rate = weightedRate;
  rate.save();
}
