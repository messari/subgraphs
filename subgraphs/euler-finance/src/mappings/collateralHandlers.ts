import { ethereum, Address, log } from "@graphprotocol/graph-ts";
import { getOrCreateLendingProtocol } from "../common/getters";
import { Transfer as CollateralTransfer } from "../../generated/templates/EToken/EToken";
import { Transfer as DebtTransfer } from "../../generated/templates/DToken/DToken";
import { Market, _MarketByToken } from "../../generated/schema";
import { addPosition, subtractPosition } from "./position";
import { PositionSide } from "../common/constants";
import { getOrCreateAccount } from "./helpers";
import { ERC20 } from "../../generated/euler/ERC20";

export function handleDebtTransfer(event: CollateralTransfer): void {
  _handleTransfer(event, PositionSide.BORROWER, event.params.to, event.params.from);
}

export function handleCollateralTransfer(event: DebtTransfer): void {
  _handleTransfer(event, PositionSide.LENDER, event.params.to, event.params.from);
}

/////////////////////////
//// Transfer Events ////
/////////////////////////

export function _handleTransfer(event: ethereum.Event, positionSide: string, to: Address, from: Address): void {
  const asset = event.address;
  const protocol = getOrCreateLendingProtocol();
  const market = getMarketByAuxillaryToken(asset);
  if (!market) {
    log.warning("[_handleTransfer] market not found: {}", [asset.toHexString()]);
    return;
  }

  // if the to / from addresses are the same as the asset
  // then this transfer is emitted as part of another event
  // ie, a deposit, withdraw, borrow, repay, etc
  // we want to let that handler take care of position updates
  // and zero addresses mean it is apart of a burn / mint
  if (to == Address.zero() || from == Address.zero() || to == asset || from == asset) {
    return;
  }

  // grab accounts
  const toAccount = getOrCreateAccount(to, protocol);
  const fromAccount = getOrCreateAccount(from, protocol);
  const tokenContract = ERC20.bind(asset);

  // update balance from sender
  subtractPosition(
    protocol,
    market,
    fromAccount,
    tokenContract.balanceOf(from),
    positionSide,
    -1, // TODO: not sure how to classify this event yet
    event,
  );

  // update balance from receiver
  addPosition(
    protocol,
    market,
    toAccount,
    tokenContract.balanceOf(to),
    positionSide,
    -1, // TODO: not sure how to classify this event yet
    event,
  );
}

function getMarketByAuxillaryToken(token: Address): Market {
  const find = _MarketByToken.load(token.toHexString());
  if (!find) {
    log.error("[getMarketByAuxillaryToken] market not found for this token: {}", [token.toHexString()]);
    log.critical("", []);
  }

  return Market.load(find!.market)!;
}
