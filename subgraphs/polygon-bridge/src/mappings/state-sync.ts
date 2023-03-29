import { Address } from "@graphprotocol/graph-ts";

import {
  StateSynced,
  NewRegistration,
  RegistrationUpdated,
} from "../../generated/StateSender/StateSender";

import { posDecoderAddress } from "../common/constants";
import { Decoder } from "../../generated/StateSender/Decoder";

export function handleStateSynced(event: StateSynced): void {
  entity.transactionHash = event.transaction.hash;
  entity.timestamp = event.block.timestamp;
  entity.blockNumber = event.block.number;
  entity.logIndex = event.logIndex.toString();
  entity.rawData = event.params.data.toHexString();

  // Attempting to create an instance of `Decoder` smart contract
  // to be used for decoding valid state sync data
  let decoder = Decoder.bind(Address.fromString(posDecoderAddress));
  // 👇 is being done because there's a possibly decoding might fail
  // if bad input is provided with
  let callResult = decoder.try_decodeStateSyncData(event.params.data);

  // this condition will be true if during decoding
  // decoder contract faces some issue
  if (callResult.reverted) {
    // We dont care about random data
    return;
  }

  // Attempting to read decoded data, so that
  // it can be stored in this entity
  let decoded = callResult.value;

  entity.syncType = decoded.value0;
  entity.depositorOrRootToken = decoded.value1.toHex();
  entity.depositedTokenOrChildToken = decoded.value2.toHex();
  entity.data = decoded.value3.toHexString();

  // save entity
  entity.save();
}

export function handleNewRegistration(event: NewRegistration): void {
  let id = "registration:" + event.params.receiver.toHexString();

  let entity = StateRegistration.load(id);
  if (entity == null) {
    entity = new StateRegistration(id);
  }
  entity.receiver = event.params.receiver;
  entity.sender = event.params.sender;
  entity.user = event.params.user;

  // save entity
  entity.save();
}

export function handleRegistrationUpdated(event: RegistrationUpdated): void {
  let id = "registration:" + event.params.receiver.toHexString();

  let entity = StateRegistration.load(id);
  if (entity == null) {
    entity = new StateRegistration(id);
  }
  entity.receiver = event.params.receiver;
  entity.sender = event.params.sender;
  entity.user = event.params.user;

  // save entity
  entity.save();
}
