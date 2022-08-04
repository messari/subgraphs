import { store, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
  Transfer as TransferEvent,
  ERC721,
} from "../../generated/ERC721/ERC721";
import {
  Collection,
  CollectionDailySnapshot,
  Transfer,
  AccountBalance,
  NonERC721Collection,
} from "../../generated/schema";

import {
  BIGINT_ZERO,
  BIGINT_ONE,
  GENESIS_ADDRESS,
  SECONDS_PER_DAY,
} from "../common/constants";
import {
  getOrCreateAccount,
  getOrCreateAccountBalance,
  updateAccountBalanceDailySnapshot,
} from "./account";
import { normalize, getOrCreateToken } from "./token";

export function handleTransfer(event: TransferEvent): void {
  let from = event.params.from.toHex();
  let to = event.params.to.toHex();
  if (from == GENESIS_ADDRESS && to == GENESIS_ADDRESS) {
    // skip if the transfer is from zero address to zero address
    return;
  }

  // determine whether this transfer is related with ERC721 collection
  let tokenId = event.params.id;
  let id = event.address.toHex() + "-" + tokenId.toString();
  let collectionId = event.address.toHex();
  let contract = ERC721.bind(event.address);
  let tokenCollection = Collection.load(collectionId);
  if (tokenCollection == null) {
    // check whether this collection has already been verified to be non-ERC721 contract to avoid to make contract calls again.
    let previousNonERC721Collection = NonERC721Collection.load(collectionId);
    if (previousNonERC721Collection != null) {
      return;
    }

    if (!isERC721Supported(contract)) {
      let newNonERC721Collection = new NonERC721Collection(collectionId);
      newNonERC721Collection.save();
      return;
    }

    let supportsERC721Metadata = supportsInterface(contract, "5b5e139f");
    tokenCollection = getOrCreateCollection(
      contract,
      collectionId,
      supportsERC721Metadata
    );
  }

  // update metrics on the sender side
  let currentOwner = getOrCreateAccount(from);
  if (from == GENESIS_ADDRESS) {
    // mint a new token
    tokenCollection.tokenCount = tokenCollection.tokenCount.plus(BIGINT_ONE);
  } else {
    // transfer an existing token from non-zero address
    let currentAccountBalanceId = from + "-" + collectionId;
    let currentAccountBalance = AccountBalance.load(currentAccountBalanceId);
    if (currentAccountBalance != null) {
      currentAccountBalance.tokenCount = currentAccountBalance.tokenCount.minus(
        BIGINT_ONE
      );
      currentAccountBalance.blockNumber = event.block.number;
      currentAccountBalance.timestamp = event.block.timestamp;
      currentAccountBalance.save();

      if (currentAccountBalance.tokenCount.equals(BIGINT_ZERO)) {
        tokenCollection.ownerCount = tokenCollection.ownerCount.minus(
          BIGINT_ONE
        );
      }

      // provide information about evolution of account balances
      updateAccountBalanceDailySnapshot(currentAccountBalance, event);
    }

    if (currentOwner != null) {
      currentOwner.tokenCount = currentOwner.tokenCount.minus(BIGINT_ONE);
    }
  }
  currentOwner.save();

  // update metrics on the receiver side
  if (to == GENESIS_ADDRESS) {
    // burn an existing token
    store.remove("Token", id);
    tokenCollection.tokenCount = tokenCollection.tokenCount.minus(BIGINT_ONE);
  } else {
    // transfer a new or existing token to non-zero address
    let newOwner = getOrCreateAccount(to);
    newOwner.tokenCount = newOwner.tokenCount.plus(BIGINT_ONE);
    newOwner.save();

    let token = getOrCreateToken(
      contract,
      tokenCollection,
      tokenId,
      event.block.timestamp
    );
    token.owner = newOwner.id;
    token.save();

    let newAccountBalance = getOrCreateAccountBalance(to, collectionId);
    newAccountBalance.tokenCount = newAccountBalance.tokenCount.plus(
      BIGINT_ONE
    );
    newAccountBalance.blockNumber = event.block.number;
    newAccountBalance.timestamp = event.block.timestamp;
    newAccountBalance.save();

    if (newAccountBalance.tokenCount.equals(BIGINT_ONE)) {
      tokenCollection.ownerCount = tokenCollection.ownerCount.plus(BIGINT_ONE);
    }

    // provide information about evolution of account balances
    updateAccountBalanceDailySnapshot(newAccountBalance, event);
  }

  // update aggregate data for sender and receiver
  tokenCollection.transferCount = tokenCollection.transferCount.plus(
    BIGINT_ONE
  );
  tokenCollection.save();

  let dailySnapshot = getOrCreateCollectionDailySnapshot(
    tokenCollection,
    event.block
  );
  dailySnapshot.dailyTransferCount += 1;
  dailySnapshot.save();

  createTransfer(event).save();
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

function getOrCreateCollection(
  contract: ERC721,
  CollectionAddress: string,
  supportsERC721Metadata: boolean
): Collection {
  let previousTokenCollection = Collection.load(CollectionAddress);

  if (previousTokenCollection != null) {
    return previousTokenCollection as Collection;
  }

  let tokenCollection = new Collection(CollectionAddress);
  tokenCollection.supportsERC721Metadata = supportsERC721Metadata;
  tokenCollection.tokenCount = BIGINT_ZERO;
  tokenCollection.ownerCount = BIGINT_ZERO;
  tokenCollection.transferCount = BIGINT_ZERO;

  let name = contract.try_name();
  if (!name.reverted) {
    tokenCollection.name = normalize(name.value);
  }
  let symbol = contract.try_symbol();
  if (!symbol.reverted) {
    tokenCollection.symbol = normalize(symbol.value);
  }

  return tokenCollection;
}

function getOrCreateCollectionDailySnapshot(
  collection: Collection,
  block: ethereum.Block
): CollectionDailySnapshot {
  let snapshotId =
    collection.id +
    "-" +
    (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let previousSnapshot = CollectionDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as CollectionDailySnapshot;
  }

  let newSnapshot = new CollectionDailySnapshot(snapshotId);
  newSnapshot.collection = collection.id;
  newSnapshot.tokenCount = collection.tokenCount;
  newSnapshot.ownerCount = collection.ownerCount;
  newSnapshot.dailyTransferCount = 0;
  newSnapshot.blockNumber = block.number;
  newSnapshot.timestamp = block.timestamp;

  return newSnapshot;
}

function createTransfer(event: TransferEvent): Transfer {
  let transfer = new Transfer(
    event.address.toHex() +
      "-" +
      event.transaction.hash.toHex() +
      "-" +
      event.logIndex.toString()
  );
  transfer.hash = event.transaction.hash.toHex();
  transfer.logIndex = event.logIndex.toI32();
  transfer.collection = event.address.toHex();
  transfer.nonce = event.transaction.nonce.toI32();
  transfer.tokenId = event.params.id;
  transfer.from = event.params.from.toHex();
  transfer.to = event.params.to.toHex();
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;

  return transfer;
}
