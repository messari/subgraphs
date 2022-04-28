// import {
//   newMockEvent,
//   test,
//   assert,
//   logStore,
//   log,
//   createMockedFunction
// } from "matchstick-as/assembly/index";
// import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
// import { BuyShares, SellShares, DODOSwap } from "../generated/DVM/DVM";
// import {
//   handleBuyShares,
//   handleSellShares,
//   handleDODOSwap
// } from "../src/mappingDVM";
// import { ERC20 } from "../generated/CP/ERC20";
// import { DVM } from "../generated/DVM/DVM";
// import { createERC20Instance, createNewDVMEvent } from "./factories.test";
//
// // event BuyShares(address to, uint256 increaseShares, uint256 totalShares);
// //
// // event SellShares(address payer, address to, uint256 decreaseShares, uint256 totalShares);
// //
// // event DODOSwap(
// //     address fromToken,
// //     address toToken,
// //     uint256 fromAmount,
// //     uint256 toAmount,
// //     address trader,
// //     address receiver
// // );
//
// export function createDVM(addressDVM: string): DVM {
//   let dVm = Address.fromString(addressDVM);
//   let version = ethereum.Value.fromString("DVM 1.0.2");
//
//   createMockedFunction(dVm, "version", "version():(string)").returns([version]);
//
//   let dvm = DVM.bind(dVm);
//   return;
// }
//
// export function createBuySharesEvent(
//   to: string,
//   increaseShares: BigInt,
//   totalShares: BigInt
// ): BuyShares {
//   let newBuySharesEvent = changetype<BuyShares>(newMockEvent());
//   newBuySharesEvent.parameters = new Array();
//
//   let too = new ethereum.EventParam(
//     "to",
//     ethereum.Value.fromAddress(Address.fromString(to))
//   );
//
//   let increaseSharess = new ethereum.EventParam(
//     "increaseShares",
//     ethereum.Value.fromBigInt(increaseShares)
//   );
//
//   let totalSharess = new ethereum.EventParam(
//     "totalShares",
//     ethereum.Value.fromBigInt(totalShares)
//   );
//
//   newBuySharesEvent.parameters.push(too);
//   newBuySharesEvent.parameters.push(increaseSharess);
//   newBuySharesEvent.parameters.push(totalSharess);
//
//   return newBuySharesEvent;
// }
//
// test("Can handle a BuyShares Event", () => {
//   let tokenb = createERC20Instance(
//     "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
//     "Input Base Token Name",
//     "IBTN",
//     18
//   );
//
//   let tokenq = createERC20Instance(
//     "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
//     "Input Quote Token Name",
//     "IQTN",
//     18
//   );
//
//   let lpToken = createERC20Instance(
//     "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
//     "LP Token",
//     "LPT",
//     18
//   );
//
//   let newDVMevent = createNewDVMEvent(
//     "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
//     "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
//     "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
//     "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
//   );
//
//   let bsEvent = createBuySharesEvent(
//     "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
//     ethereum.Value.fromString("1000000000000000000"),
//     ethereum.Value.fromString("1000000000000000000")
//   );
// });
