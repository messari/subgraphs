import { Address } from "@graphprotocol/graph-ts";
import {
  TruefiPool2,
  Joined,
  Exited,
  Transfer,
} from "../../generated/templates/TruefiPool2/TruefiPool2";
import { Market } from "../../generated/schema";
import { BIGINT_ZERO } from "../utils/constants";
import { createDeposit, createWithdraw } from "../entities/event";
import { createMarket, getMarket, updateTokenSupply } from "../entities/market";
import { updateUserLenderPosition } from "../entities/position";
import { LEGACY_POOL_TOKEN_ADDRESS, ZERO_ADDRESS } from "../utils/constants";

export function handleJoin(event: Joined): void {
  let market = Market.load(event.address.toHexString());
  if (market != null) {
    createDeposit(
      event,
      Address.fromString(market.inputToken),
      event.params.staker,
      event.params.deposited
    );
    updateTokenSupply(event, event.address, true);
  }
}

export function handleExit(event: Exited): void {
  let market = Market.load(event.address.toHexString());
  if (market != null) {
    createWithdraw(
      event,
      Address.fromString(market.inputToken),
      event.params.staker,
      event.params.amount
    );

    updateTokenSupply(event, event.address, true);
  }
}

export function handleTransferForLegacyPool(event: Transfer): void {
  // This is for legacy tfTUSD pool
  let market = Market.load(event.address.toHexString());
  if (market == null) {
    createMarket(
      event,
      Address.fromString(LEGACY_POOL_TOKEN_ADDRESS),
      event.address
    );
  }

  handleTransfer(event);
}

export function handleTransfer(event: Transfer): void {
  if (event.params.value.equals(BIGINT_ZERO)) {
    return;
  }

  if (
    event.params.from != Address.fromString(ZERO_ADDRESS) &&
    event.params.to != Address.fromString(ZERO_ADDRESS)
  ) {
    let market = Market.load(event.address.toHexString());
    if (market == null) {
      return;
    }

    const poolAddress = Address.fromString(event.address.toHexString());
    const contract = TruefiPool2.bind(event.address);
    // Handle transfer as withdraw + deposit
    createWithdraw(
      event,
      Address.fromString(market.inputToken),
      event.params.from,
      event.params.value,
      true
    );
    updateUserLenderPosition(
      event,
      event.params.from,
      getMarket(poolAddress),
      contract.balanceOf(event.params.from)
    );

    createDeposit(
      event,
      Address.fromString(market.inputToken),
      event.params.to,
      event.params.value,
      true
    );
    updateUserLenderPosition(
      event,
      event.params.to,
      getMarket(poolAddress),
      contract.balanceOf(event.params.to)
    );
  }
}
