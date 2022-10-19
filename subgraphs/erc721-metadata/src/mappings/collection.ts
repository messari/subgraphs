import { Bytes } from "@graphprotocol/graph-ts";

import { Transfer, ERC721 } from "../../generated/ERC721/ERC721";
import { Token, Collection, NonERC721Collection } from "../../generated/schema";

import { NetworkConfigs } from "../../configurations/configure";
import { GENESIS_ADDRESS, BIGINT_ONE, BIGINT_ZERO } from "../common/constants";
import { createToken, normalize, updateTokenMetadata } from "./token";
import { getOrCreateSubgraph } from "./subgraph";

export function handleTransfer(event: Transfer): void {
  let from = event.params.from.toHex();
  let to = event.params.to.toHex();
  if (from == GENESIS_ADDRESS && to == GENESIS_ADDRESS) {
    // skip if the transfer is from zero address to zero address
    return;
  }

  // determine whether this transfer is related with ERC721 collection
  let tokenId = event.params.id;
  let contract = ERC721.bind(event.address);
  let collectionId = event.address.toHex();
  let tokenCollection = Collection.load(collectionId);
  if (tokenCollection == null) {
    // check whether the collection has already been verified to be non-ERC721 contract to avoid to make contract calls again.
    let previousNonERC721Collection = NonERC721Collection.load(collectionId);
    if (previousNonERC721Collection != null) {
      return;
    }

    if (!isERC721Supported(contract)) {
      let newNonERC721Collection = new NonERC721Collection(collectionId);
      newNonERC721Collection.subgraph = getOrCreateSubgraph().id;
      newNonERC721Collection.save();
      return;
    }

    // Save info for the ERC721 collection
    let supportsERC721Metadata = supportsInterface(contract, "5b5e139f");
    tokenCollection = getOrCreateCollection(
      collectionId,
      supportsERC721Metadata
    );

    tokenCollection.save();
  }

  // Only if the collection supports ERC721 metadata, the detailed token metadata information will be stored.
  if (!tokenCollection.supportsERC721Metadata) {
    return;
  }

  // ERC721 collection created via registry list (supportsERC721Metadata defaults to false until ERC721 transfer is indexed)
  if (
    NetworkConfigs.getTokenList().length > 0 &&
    tokenCollection.tokenCount.equals(BIGINT_ZERO)
  ) {
    let supportsERC721Metadata = supportsInterface(contract, "5b5e139f");
    tokenCollection.supportsERC721Metadata = supportsERC721Metadata;
    tokenCollection.save();
  }

  let existingToken = Token.load(tokenCollection.id + "-" + tokenId.toString());
  if (existingToken == null) {
    // Store metadata for the specific tokenId.
    let currentToken = createToken(event, contract, tokenCollection, tokenId);
    currentToken.save();

    tokenCollection.tokenCount = tokenCollection.tokenCount.plus(BIGINT_ONE);
    tokenCollection.save();
    return;
  }

  // Only if the collection supports ERC721 metadata, the detailed token metadata information will be stored.
  if (!tokenCollection.supportsERC721Metadata) {
    return;
  }

  // previousToken isn't null which means the metadata for the tokenId was stored before.
  // So check whether the tokenURI has changed to decide whether the metadata need to be updated.
  let metadataURI = contract.try_tokenURI(tokenId);
  if (!metadataURI.reverted) {
    let tokenURI = normalize(metadataURI.value);
    if (tokenURI.length > 0 && tokenURI != existingToken.tokenURI) {
      tokenCollection.tokenURIUpdated = true;
      tokenCollection.save();

      existingToken.tokenURI = tokenURI;
      existingToken = updateTokenMetadata(event, existingToken);
      existingToken.blockNumber = event.block.number;
      existingToken.timestamp = event.block.timestamp;
      existingToken.save();
    }
  }
}

function supportsInterface(
  contract: ERC721,
  interfaceId: string,
  expected: boolean = true
): boolean {
  let supports = contract.try_supportsInterface(
    Bytes.fromHexString(interfaceId)
  );
  return !supports.reverted && supports.value == expected;
}

function isERC721Supported(contract: ERC721): boolean {
  let supportsERC165Identifier = supportsInterface(contract, "01ffc9a7");
  if (!supportsERC165Identifier) {
    return false;
  }

  let supportsERC721Identifier = supportsInterface(contract, "80ac58cd");
  if (!supportsERC721Identifier) {
    return false;
  }

  let supportsNullIdentifierFalse = supportsInterface(
    contract,
    "00000000",
    false
  );
  if (!supportsNullIdentifierFalse) {
    return false;
  }

  return true;
}

export function getOrCreateCollection(
  collectionAddress: string,
  supportsERC721Metadata: boolean
): Collection {
  let tokenCollection = Collection.load(collectionAddress);
  if (!tokenCollection) {
    tokenCollection = new Collection(collectionAddress);
    tokenCollection.subgraph = getOrCreateSubgraph().id;
    tokenCollection.supportsERC721Metadata = supportsERC721Metadata;
    tokenCollection.tokenURIUpdated = false;
    tokenCollection.tokenCount = BIGINT_ZERO;
  }

  return tokenCollection;
}
