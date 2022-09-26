import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  ManagedPortfolio,
  Deposited,
  Withdrawn,
  Transfer,
} from "../../generated/templates/ManagedPortfolio/ManagedPortfolio";
import { Market } from "../../generated/schema";
import { createDeposit, createWithdraw } from "../entities/event";
import {
  closeMarket,
  createMarket,
  getMarket,
  updateTokenSupply,
} from "../entities/market";
import { updateUserLenderPosition } from "../entities/position";
import { BIGINT_ZERO, ZERO_ADDRESS } from "../utils/constants";

export function handleDeposit(event: Deposited): void {
  let market = getOrCreateMarketForPortfolio(event);
  if (market != null) {
    createDeposit(
      event,
      Address.fromString(market.inputToken),
      event.params.lender,
      event.params.amount
    );
    updateTokenSupply(event, event.address, false);
  }
}

export function handleWithdraw(event: Withdrawn): void {
  let market = Market.load(event.address.toHexString());
  if (market != null) {
    closeMarket(market);

    createWithdraw(
      event,
      Address.fromString(market.inputToken),
      event.params.lender,
      event.params.receivedAmount
    );

    updateTokenSupply(event, event.address, false);
  }
}

export function handleTransfer(event: Transfer): void {
  if (event.params.value.equals(BIGINT_ZERO)) {
    return;
  }

  getOrCreateMarketForPortfolio(event);

  const poolAddress = event.address;
  const contract = ManagedPortfolio.bind(event.address);
  // ManagedPortfolio: transfer of LP tokens from Non-Zero address to another Non-Zero address is prohibited.
  if (event.params.from == Address.fromString(ZERO_ADDRESS)) {
    updateUserLenderPosition(
      event,
      event.params.to,
      getMarket(poolAddress),
      contract.balanceOf(event.params.to)
    );
    return;
  }

  updateUserLenderPosition(
    event,
    event.params.from,
    getMarket(poolAddress),
    contract.balanceOf(event.params.from)
  );
}

function getOrCreateMarketForPortfolio(event: ethereum.Event): Market | null {
  let market = Market.load(event.address.toHexString());

  if (market == null) {
    const contract = ManagedPortfolio.bind(event.address);
    const tokenResult = contract.try_underlyingToken();
    if (!tokenResult.reverted) {
      const token = tokenResult.value;
      createMarket(event, token, event.address);
    }
  }

  return Market.load(event.address.toHexString());
}
