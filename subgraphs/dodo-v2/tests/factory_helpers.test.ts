import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { createMockedFunction, newMockEvent } from "matchstick-as";
import { NewDVM } from "../generated/DVMFactory/DVMFactory";
import { NewDSP } from "../generated/DSPFactory/DSPFactory";
import { NewDPP } from "../generated/DPPFactory/DPPFactory";
import { NewCP } from "../generated/CrowdPoolingFactory/CrowdPoolingFactory";
import { ERC20 } from "../generated/CP/ERC20";
import { DVM } from "../generated/DVM/DVM";

export function createERC20Instance(
  tokenAdd: string,
  namei: string,
  symboli: string,
  decimalsi: i32
): ERC20 {
  let erc20Base = Address.fromString(tokenAdd);
  let name = ethereum.Value.fromString(namei);
  let symbol = ethereum.Value.fromString(symboli);
  let decimals = ethereum.Value.fromI32(decimalsi);

  createMockedFunction(erc20Base, "name", "name():(string)").returns([name]);
  createMockedFunction(erc20Base, "symbol", "symbol():(string)").returns([
    symbol
  ]);
  createMockedFunction(erc20Base, "decimals", "decimals():(uint8)").returns([
    decimals
  ]);

  let erc20 = ERC20.bind(erc20Base);
  return erc20;
}

export function createNewDVMEvent(
  baseToken: string,
  quoteToken: string,
  creator: string,
  dvm: string
): NewDVM {
  let tokenb = createERC20Instance(
    baseToken,
    "Input Base Token Name",
    "IBTN",
    18
  );

  let tokenq = createERC20Instance(
    quoteToken,
    "Input Quote Token Name",
    "IQTN",
    18
  );

  let lpToken = createERC20Instance(dvm, "LP Token", "LPT", 18);
  let dVm = Address.fromString(dvm);
  let version = ethereum.Value.fromString("DVM 1.0.2");

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let newDVMevent = changetype<NewDVM>(newMockEvent());
  newDVMevent.parameters = new Array();

  let baseTokenParam = new ethereum.EventParam(
    "baseToken",
    ethereum.Value.fromAddress(Address.fromString(baseToken))
  );

  let quoteTokenParam = new ethereum.EventParam(
    "quoteToken",
    ethereum.Value.fromAddress(Address.fromString(quoteToken))
  );

  let creatorParam = new ethereum.EventParam(
    "creator",
    ethereum.Value.fromAddress(Address.fromString(creator))
  );

  let dvmParam = new ethereum.EventParam(
    "dvm",
    ethereum.Value.fromAddress(Address.fromString(dvm))
  );

  newDVMevent.parameters.push(baseTokenParam);
  newDVMevent.parameters.push(quoteTokenParam);
  newDVMevent.parameters.push(creatorParam);
  newDVMevent.parameters.push(dvmParam);

  return newDVMevent;
}

// export function createNewDSPEvent(
//   baseToken: string,
//   quoteToken: string,
//   creator: string,
//   dsp: string
// ): NewDSP {
//   let dVm = Address.fromString(dsp);
//   let version = ethereum.Value.fromString("DSP 1.0.1");
//
//   createMockedFunction(dVm, "version", "version():(string)").returns([version]);
//
//   let newDSPevent = changetype<NewDSP>(newMockEvent());
//   newDSPevent.parameters = new Array();
//
//   let baseTokenParam = new ethereum.EventParam(
//     "baseToken",
//     ethereum.Value.fromAddress(Address.fromString(baseToken))
//   );
//
//   let quoteTokenParam = new ethereum.EventParam(
//     "quoteToken",
//     ethereum.Value.fromAddress(Address.fromString(quoteToken))
//   );
//
//   let creatorParam = new ethereum.EventParam(
//     "creator",
//     ethereum.Value.fromAddress(Address.fromString(creator))
//   );
//
//   let dspParam = new ethereum.EventParam(
//     "dsp",
//     ethereum.Value.fromAddress(Address.fromString(dsp))
//   );
//
//   newDSPevent.parameters.push(baseTokenParam);
//   newDSPevent.parameters.push(quoteTokenParam);
//   newDSPevent.parameters.push(creatorParam);
//   newDSPevent.parameters.push(dspParam);
//
//   return newDSPevent;
// }
//
// export function createNewDPPEvent(
//   baseToken: string,
//   quoteToken: string,
//   creator: string,
//   dpp: string
// ): NewDPP {
//   let dVm = Address.fromString(dpp);
//   let version = ethereum.Value.fromString("DPP 1.0.0");
//
//   createMockedFunction(dVm, "version", "version():(string)").returns([version]);
//
//   let newDPPevent = changetype<NewDPP>(newMockEvent());
//   newDPPevent.parameters = new Array();
//
//   let baseTokenParam = new ethereum.EventParam(
//     "baseToken",
//     ethereum.Value.fromAddress(Address.fromString(baseToken))
//   );
//
//   let quoteTokenParam = new ethereum.EventParam(
//     "quoteToken",
//     ethereum.Value.fromAddress(Address.fromString(quoteToken))
//   );
//
//   let creatorParam = new ethereum.EventParam(
//     "creator",
//     ethereum.Value.fromAddress(Address.fromString(creator))
//   );
//
//   let dppParam = new ethereum.EventParam(
//     "dpp",
//     ethereum.Value.fromAddress(Address.fromString(dpp))
//   );
//
//   newDPPevent.parameters.push(baseTokenParam);
//   newDPPevent.parameters.push(quoteTokenParam);
//   newDPPevent.parameters.push(creatorParam);
//   newDPPevent.parameters.push(dppParam);
//
//   return newDPPevent;
// }
//
// export function createNewCPEvent(
//   baseToken: string,
//   quoteToken: string,
//   creator: string,
//   cp: string
// ): NewCP {
//   let dVm = Address.fromString(cp);
//   let version = ethereum.Value.fromString("CP 1.0.0");
//
//   createMockedFunction(dVm, "version", "version():(string)").returns([version]);
//
//   let newCPevent = changetype<NewCP>(newMockEvent());
//   newCPevent.parameters = new Array();
//
//   let baseTokenParam = new ethereum.EventParam(
//     "baseToken",
//     ethereum.Value.fromAddress(Address.fromString(baseToken))
//   );
//
//   let quoteTokenParam = new ethereum.EventParam(
//     "quoteToken",
//     ethereum.Value.fromAddress(Address.fromString(quoteToken))
//   );
//
//   let creatorParam = new ethereum.EventParam(
//     "creator",
//     ethereum.Value.fromAddress(Address.fromString(creator))
//   );
//
//   let cpParam = new ethereum.EventParam(
//     "cp",
//     ethereum.Value.fromAddress(Address.fromString(cp))
//   );
//
//   newCPevent.parameters.push(baseTokenParam);
//   newCPevent.parameters.push(quoteTokenParam);
//   newCPevent.parameters.push(creatorParam);
//   newCPevent.parameters.push(cpParam);
//
//   return newCPevent;
// }
