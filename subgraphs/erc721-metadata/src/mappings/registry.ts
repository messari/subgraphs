import { Address, log } from "@graphprotocol/graph-ts";

import { Unknown as UnknownEvent } from "../../generated/TokenRegistry/TokenRegistry";
import { Collection } from "../../generated/schema";
import { ERC721 as ERC721Template } from "../../generated/templates";

import { top100 } from "../common/tokenList";
import { getOrCreateCollection } from "./collection";

export function initTokenList(event: UnknownEvent): void {
  log.debug("Initializing token registry, block={}", [
    event.block.number.toString(),
  ]);

  for (let i = 0; i < top100.length; i++) {
    let collectionId = top100[i];
    let tokenCollection = Collection.load(collectionId);
    if (!tokenCollection) {
      let contractAddress = Address.fromString(collectionId);
      let collection = getOrCreateCollection(
        collectionId,
        false
      );

      collection.save();

      ERC721Template.create(contractAddress);

      log.debug("Adding ERC721 token to registry, address: {}", [
        collection.id
      ]);
    } else {
      log.warning("ERC721 Token already in registry, address: {}", [tokenCollection.id]);
    }
  }
}
