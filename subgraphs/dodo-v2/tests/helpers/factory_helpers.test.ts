import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { createMockedFunction, newMockEvent } from "matchstick-as";
import { NewDVM } from "../../generated/DVMFactory/DVMFactory";
import { NewDSP } from "../../generated/DSPFactory/DSPFactory";
import { NewDPP } from "../../generated/DPPFactory/DPPFactory";
import { NewCP } from "../../generated/CrowdPoolingFactory/CrowdPoolingFactory";
import { ERC20 } from "../../generated/CP/ERC20";
import { DVM } from "../../generated/DVM/DVM";
import { createERC20Instance } from "./simulation_helper.test";

import {
  Account1Add,
  Account2Add,
  Token1Add,
  Token2Add,
  Token3Add,
  Token4Add,
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  WRAPPED_ETH,
  DAI,
  USDC,
  USDT,
  DVMPoolAddress,
  DSPPoolAddress,
  DPPPoolAddress,
  CPPoolAddress,
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS,
  TxHash
} from "./constants.test";

export function createNewDVMEvent(
  baseToken: string,
  quoteToken: string,
  creator: string,
  dvm: string
): NewDVM {
  let lpToken = createERC20Instance(dvm, "LP Token", "LPT", 18);
  let dVm = Address.fromString(dvm);
  let version = ethereum.Value.fromString("DVM 1.0.2");

  let newDVMevent = changetype<NewDVM>(newMockEvent());
  newDVMevent.parameters = new Array();

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

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

export function createNewDSPEvent(
  baseToken: string,
  quoteToken: string,
  creator: string,
  dsp: string
): NewDSP {
  let dVm = Address.fromString(dsp);
  let version = ethereum.Value.fromString("DSP 1.0.1");
  let lpToken = createERC20Instance(dsp, "LP Token", "LPT", 18);

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let newDSPevent = changetype<NewDSP>(newMockEvent());
  newDSPevent.parameters = new Array();

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

  let dspParam = new ethereum.EventParam(
    "dsp",
    ethereum.Value.fromAddress(Address.fromString(dsp))
  );

  newDSPevent.parameters.push(baseTokenParam);
  newDSPevent.parameters.push(quoteTokenParam);
  newDSPevent.parameters.push(creatorParam);
  newDSPevent.parameters.push(dspParam);

  return newDSPevent;
}

export function createNewDPPEvent(
  baseToken: string,
  quoteToken: string,
  creator: string,
  dpp: string
): NewDPP {
  let dVm = Address.fromString(dpp);
  let version = ethereum.Value.fromString("DPP 1.0.0");
  let lpToken = createERC20Instance(dpp, "LP Token", "LPT", 18);

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let newDPPevent = changetype<NewDPP>(newMockEvent());
  newDPPevent.parameters = new Array();

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

  let dppParam = new ethereum.EventParam(
    "dpp",
    ethereum.Value.fromAddress(Address.fromString(dpp))
  );

  newDPPevent.parameters.push(baseTokenParam);
  newDPPevent.parameters.push(quoteTokenParam);
  newDPPevent.parameters.push(creatorParam);
  newDPPevent.parameters.push(dppParam);

  return newDPPevent;
}

export function createNewCPEvent(
  baseToken: string,
  quoteToken: string,
  creator: string,
  cp: string
): NewCP {
  let dVm = Address.fromString(cp);
  let version = ethereum.Value.fromString("CP 1.0.0");
  let lpToken = createERC20Instance(cp, "LP Token", "LPT", 18);

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let newCPevent = changetype<NewCP>(newMockEvent());
  newCPevent.parameters = new Array();

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

  let cpParam = new ethereum.EventParam(
    "cp",
    ethereum.Value.fromAddress(Address.fromString(cp))
  );

  newCPevent.parameters.push(baseTokenParam);
  newCPevent.parameters.push(quoteTokenParam);
  newCPevent.parameters.push(creatorParam);
  newCPevent.parameters.push(cpParam);

  return newCPevent;
}
