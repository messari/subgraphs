import { ethereum, Address, BigDecimal } from "@graphprotocol/graph-ts";
import { TokenPricer } from "./config";

// Protocol is an interface that all protocols in the library
// implement. It allows certain common pieces to be independent of the
// protocol type they are working with.
export interface Protocol {
  getID(): string;
  getCurrentEvent(): ethereum.Event;
  getTokenPricer(): TokenPricer;

  addUser(count: u8): void;
  addTotalValueLocked(amount: BigDecimal): void;
  addSupplySideRevenueUSD(rev: BigDecimal): void;
  addProtocolSideRevenueUSD(rev: BigDecimal): void;
  addRevenueUSD(protocolSide: BigDecimal, supplySide: BigDecimal): void;

  storeAccount(address: Address): void;
}
