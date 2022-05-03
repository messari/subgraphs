import {
  newMockEvent,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Bid } from "../../generated/CP/CP";
import { ERC20 } from "../../generated/CP/ERC20";
import { CP } from "../../generated/CP/CP";
import { createERC20Instance, createNewCPEvent } from "./factory_helpers.test";

//    event Bid(address to, uint256 amount, uint256 fee);

export function createBidEvent(to: string, amount: string, fee: string): Bid {
  let newDVMevent = createNewCPEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );

  let newBuySharesEvent = changetype<Bid>(newMockEvent());

  let dvmAdd = Address.fromString("0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4");

  newBuySharesEvent.address = dvmAdd;

  createMockedFunction(dvmAdd, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(dvmAdd)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amount))]);

  newBuySharesEvent.parameters = new Array();

  let too = new ethereum.EventParam(
    "to",
    ethereum.Value.fromAddress(Address.fromString(to))
  );

  let amnt = new ethereum.EventParam(
    "amount",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amount))
  );

  let feee = new ethereum.EventParam(
    "fee",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(fee))
  );

  newBuySharesEvent.parameters.push(too);
  newBuySharesEvent.parameters.push(amnt);
  newBuySharesEvent.parameters.push(feee);

  return newBuySharesEvent;
}
