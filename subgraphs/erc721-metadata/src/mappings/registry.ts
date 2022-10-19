import { Address, log } from "@graphprotocol/graph-ts";

import { Unknown as UnknownEvent } from "../../generated/TokenRegistry/TokenRegistry";
import { Collection } from "../../generated/schema";
import { ERC721 as ERC721Template } from "../../generated/templates";

import { NetworkConfigs } from "../../configurations/configure";
import { getOrCreateCollection } from "./collection";

export function initTokenList(event: UnknownEvent): void {
  log.debug("Initializing token registry, block={}", [
    event.block.number.toString(),
  ]);

  let tokenList = NetworkConfigs.getTokenList();

  for (let i = 0; i < tokenList.length; i++) {
    let collectionId = tokenList[i];
    let tokenCollection = Collection.load(collectionId);
    if (!tokenCollection) {
      let contractAddress = Address.fromString(collectionId);
      let collection = getOrCreateCollection(collectionId, false);

      collection.save();

      ERC721Template.create(contractAddress);

      log.debug("Adding ERC721 token to registry, address: {}", [
        collection.id,
      ]);
    } else {
      log.warning("ERC721 Token already in registry, address: {}", [
        tokenCollection.id,
      ]);
    }
  }
}
