import { ethereum, log, Bytes, BigInt, Address } from "@graphprotocol/graph-ts";
import { EvInventory } from "../generated/X2Y2Exchange/X2Y2Exchange";
import { Collection, Marketplace, Trade } from "../generated/schema";
import { NftMetadata } from "../generated/X2Y2Exchange/NftMetadata";
import {
  BIGDECIMAL_ZERO,
  EXCHANGE_ADDRESS,
  MANTISSA_FACTOR,
  Network,
  NftStandard,
  SaleStrategy,
  X2Y2Op,
} from "./helper";

class Token {
  constructor(
    public readonly address: Address,
    public readonly tokenId: BigInt
  ) {}
}

export function handleEvInventory(event: EvInventory): void {
  let tokens = decodeTokens(event.params.item.data);
  let collectionID = tokens[0].address.toHexString()
  let collection = getOrCreateCollection(collectionID)

  for (let i = 0; i < tokens.length; i++) {
    let trade = new Trade(
      event.transaction.hash
        .toHexString()
        .concat("-")
        .concat(event.logIndex.toString())
        .concat("-")
        .concat(i.toString())
    );
    trade.transactionHash = event.transaction.hash.toHexString();
    trade.logIndex = event.logIndex.toI32();
    trade.timestamp = event.block.timestamp;
    trade.blockNumber = event.block.number;
    trade.orderHash = ""; // TODO: remove orderHash from schema
    trade.collection = collectionID;
    trade.tokenId = tokens[i].tokenId;
    // TODO: wrong?
    trade.priceETH = event.params.item.price.toBigDecimal().div(MANTISSA_FACTOR);
    trade.amount = BigInt.fromI32(1);
    // TODO: private sale is also possible
    trade.strategy = SaleStrategy.STANDARD_SALE;
    if (event.params.detail.op == X2Y2Op.COMPLETE_BUY_OFFER) {
      trade.buyer = event.params.maker.toHexString();
      trade.seller = event.params.taker.toHexString();
    } else if (event.params.detail.op == X2Y2Op.COMPLETE_SELL_OFFER) {
      trade.buyer = event.params.taker.toHexString();
      trade.seller = event.params.maker.toHexString();
    }
    trade.save();
  }

  let fees = event.params.detail.fees
}

function getOrCreateCollection(collectionID: string): Collection {
  let collection = Collection.load(collectionID);
  if (!collection) {
    collection = new Collection(collectionID);
    // TODO: only ERC721 is supported atm, but more (such as ERC1155) will come
    collection.nftStandard = NftStandard.ERC721;
    let contract = NftMetadata.bind(Address.fromString(collectionID));
    let nameResult = contract.try_name();
    if (!nameResult.reverted) {
      collection.name = nameResult.value;
    }
    let symbolResult = contract.try_symbol();
    if (!symbolResult.reverted) {
      collection.symbol = symbolResult.value;
    }
    let totalSupplyResult = contract.try_totalSupply();
    if (!totalSupplyResult.reverted) {
      collection.totalSupply = totalSupplyResult.value;
    }
    collection.royaltyFee = BIGDECIMAL_ZERO;
    collection.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    collection.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    collection.creatorRevenueETH = BIGDECIMAL_ZERO;
    collection.totalRevenueETH = BIGDECIMAL_ZERO;
    collection.tradeCount = 0;
    collection.buyerCount = 0;
    collection.sellerCount = 0;
    collection.save();

    let marketplace = getOrCreateMarketplace(EXCHANGE_ADDRESS.toHexString());
    marketplace.collectionCount += 1;
    marketplace.save();
  }
  return collection;
}

function getOrCreateMarketplace(marketplaceID: string): Marketplace {
  let marketplace = Marketplace.load(marketplaceID);
  if (!marketplace) {
    marketplace = new Marketplace(marketplaceID);
    marketplace.name = "X2Y2";
    marketplace.network = Network.MAINNET;
    marketplace.schemaVersion = "0.0.1";
    marketplace.subgraphVersion = "0.0.1";
    marketplace.methodologyVersion = "0.0.1";
    marketplace.collectionCount = 0;
    marketplace.tradeCount = 0;
    marketplace.cumulativeTradeVolumeETH = BIGDECIMAL_ZERO;
    marketplace.marketplaceRevenueETH = BIGDECIMAL_ZERO;
    marketplace.creatorRevenueETH = BIGDECIMAL_ZERO;
    marketplace.totalRevenueETH = BIGDECIMAL_ZERO;
    marketplace.cumulativeUniqueTraders = 0;
    marketplace.save();
  }
  return marketplace;
}

/**
 * Same effect as `abi.decode(data, (Pair[]))` but in assemblyscript
 * @param data encoding `struct Pair { IERC721 token; uint256 tokenId; }`
 */
function decodeTokens(data: Bytes): Array<Token> {
  let decoded = ethereum.decode("(address,uint256)[]", data);
  let result: Array<Token> = [];
  if (!decoded) {
    log.warning("failed to decode {}", [data.toHexString()]);
  } else {
    let pairs = decoded.toArray();
    for (let i = 0; i < pairs.length; i++) {
      let pair = pairs[i].toTuple();
      result.push(new Token(pair[0].toAddress(), pair[1].toBigInt()));
    }
  }
  return result;
}
