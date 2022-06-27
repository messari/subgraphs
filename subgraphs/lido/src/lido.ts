import { Submitted } from "../generated/Lido/Lido";
import { LidoSubmission } from "../generated/schema";
import { getOrCreateProtocol } from "./protocol";
import { getTokenOrCreate } from "./token";
import { PROTOCOL_CONTRACT } from "./utils/constants";
import { Address } from "@graphprotocol/graph-ts";

export function handleSubmit(event: Submitted): void {
    // TODO: move to right place
    const protocol = getOrCreateProtocol();
    const token = getTokenOrCreate(Address.fromString(PROTOCOL_CONTRACT), event.block);

    let entity = new LidoSubmission(
      event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    )
  
    entity.sender = event.params.sender
    entity.amount = event.params.amount
    entity.referral = event.params.referral

    entity.save()
  }