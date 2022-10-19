import { Address, log } from "@graphprotocol/graph-ts";

import { Unknown as UnknownEvent } from "../../generated/ERC721Holders/TokenRegistry";
import { ERC721 } from "../../generated/ERC721Holders/ERC721";
import { ERC721 as ERC721Template } from "../../generated/templates";
import { Collection } from "../../generated/schema";

import { getOrCreateCollection } from "./collection";
import { NetworkConfigs } from "../../configurations/configure";

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
      let contract = ERC721.bind(contractAddress);
      let collection = getOrCreateCollection(contract, collectionId, false);

      // Workaround for ENS (doesn't support name/symbol field in ERC721 contract)
      if (
        contractAddress.equals(
          Address.fromString("0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85")
        )
      ) {
        collection.name = "Ethereum Name Service";
        collection.symbol = "ENS";
        log.debug("ENS name set: {}", [collection.id]);
      }

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
