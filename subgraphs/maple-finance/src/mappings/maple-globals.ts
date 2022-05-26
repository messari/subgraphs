import {
  GlobalsParamSet as GlobalsParamSetEvent,
  SetValidPoolFactoryCall
} from "../../generated/MapleGlobals/MapleGlobals";

// import {
//     MarketListed as MarketListedEvent,
//     NewPriceOracle as NewPriceOracleEvent,
//     MarketEntered as MarketEnteredEvent,
//     MarketExited as MarketExitedEvent,
// } from "../../generated/comptroller/comptroller";

// import { Market, Protocol, User, UserMarket } from "../../generated/schema";
// import { CToken as CTokenTemplate } from "../../generated/templates";

export function handleGlobalsParamSet(event: GlobalsParamSetEvent): void {
  // Accessing the event parameters
  event.params.value;
  event.params.which;

  // Accessing event data
  event.block.timestamp;
  event.transaction.from;
}

export function handleSetValidPoolFactory(call: SetValidPoolFactoryCall): void {
  // Access function call inputs
  call.inputs.poolFactory;
  call.inputs.valid;

  // Access other call data
  call.block.timestamp;
  call.transaction.value;
}
