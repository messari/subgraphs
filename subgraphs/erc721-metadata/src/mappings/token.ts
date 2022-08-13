import {
  BigInt,
  BigDecimal,
  ethereum,
  ipfs,
  json,
  JSONValue,
  JSONValueKind,
} from "@graphprotocol/graph-ts";
import { ERC721 } from "../../generated/ERC721/ERC721";
import { Token, Attribute, Collection } from "../../generated/schema";
import {
  IPFS_PREFIX,
  IPFS_SLASH,
  IPFS_PREFIX_LEN,
  IPFS_SLASH_LEN,
} from "../common/constants";

export function normalize(strValue: string): string {
  if (strValue.length == 1 && strValue.charCodeAt(0) == 0) {
    return "";
  }

  for (let i = 0; i < strValue.length; i++) {
    if (strValue.charCodeAt(i) == 0) {
      // graph-node database does not support string with '\u0000'
      strValue = strValue.substr(0, i) + "\ufffd" + strValue.substr(i + 1);
    }
  }
  return strValue.trim();
}

export function createToken(
  contract: ERC721,
  tokenCollection: Collection,
  tokenId: BigInt,
  block: ethereum.Block
): Token {
  let contractTokenId = tokenCollection.id + "-" + tokenId.toString();

  let newToken = new Token(contractTokenId);
  newToken.collection = tokenCollection.id;
  newToken.tokenId = tokenId;
  newToken.blockNumber = block.number;
  newToken.timestamp = block.timestamp;

  let metadataURI = contract.try_tokenURI(tokenId);
  if (!metadataURI.reverted) {
    newToken.tokenURI = normalize(metadataURI.value);
    return updateTokenMetadata(contract, newToken);
  }

  return newToken;
}

export function updateTokenMetadata(contract: ERC721, token: Token): Token {
  if (token.tokenURI == null) {
    return token;
  }
  let tokenURI = token.tokenURI;
  // Retrieve and parse the metadata if tokenURI indicates the token metadata stores in IPFS.
  let index1 = tokenURI!.lastIndexOf(IPFS_SLASH);
  let index2 = tokenURI!.lastIndexOf(IPFS_PREFIX);
  if (index1 < 0 && index2 < 0) {
    return token;
  }

  let hash: string = "";
  if (index1 >= 0) {
    hash = tokenURI!.substr(index1 + IPFS_SLASH_LEN);
  } else if (index2 >= 0) {
    hash = tokenURI!.substr(index2 + IPFS_PREFIX_LEN);
  }
  if (hash.length == 0) {
    return token;
  }

  let data = ipfs.cat(hash);
  if (!data) {
    return token;
  }
  let dataJson = json.try_fromBytes(data);
  if (dataJson.isError) {
    return token;
  }

  let dataObject = dataJson.value.toObject();
  // Parse the token metadata according to OpenSea metadata standards.
  token.imageURI = valueToString(dataObject.get("image"));
  token.externalURI = valueToString(dataObject.get("external_url"));
  token.description = valueToString(dataObject.get("description"));
  token.name = valueToString(dataObject.get("name"));
  token.backgroundColor = valueToString(dataObject.get("background_color"));
  token.animationURI = valueToString(dataObject.get("animation_url"));
  token.youtubeURI = valueToString(dataObject.get("youtube_url"));

  let attributes = valueToArray(dataObject.get("attributes"));
  for (let i = 0; i < attributes.length; i++) {
    let item = attributes[i].toObject();
    let trait = valueToString(item.get("trait_type"));
    if (trait == null) {
      continue;
    }

    let valueJson = item.get("value");
    let valueString: string | null = null;
    if (valueJson == null) {
      valueString = null;
    } else if (valueJson.kind == JSONValueKind.STRING) {
      valueString = valueJson.toString();
    } else if (valueJson.kind == JSONValueKind.NUMBER) {
      valueString = valueJson.toF64().toString();
    } else if (valueJson.kind == JSONValueKind.BOOL) {
      valueString = valueJson.toBool().toString();
    }

    let maxValueJson = item.get("max_value");
    let maxValueString: string | null = null;
    if (maxValueJson == null) {
      maxValueString = null;
    } else if (maxValueJson.kind == JSONValueKind.STRING) {
      maxValueString = maxValueJson.toString();
    } else if (maxValueJson.kind == JSONValueKind.NUMBER) {
      maxValueString = maxValueJson.toF64().toString();
    }

    let attribute = new Attribute(token.id + "-" + trait!);
    attribute.collection = token.collection;
    attribute.tokenId = token.tokenId;
    attribute.token = token.id;
    attribute.traitType = trait!;
    attribute.value = valueString;
    attribute.maxValue = maxValueString;
    attribute.displayType = valueToString(item.get("display_type"));
    attribute.save();
  }
  return token;
}

function valueToString(value: JSONValue | null): string | null {
  if (value != null && value.kind == JSONValueKind.STRING) {
    return value.toString();
  }
  return null;
}

function valueToArray(value: JSONValue | null): Array<JSONValue> {
  if (value != null && value.kind == JSONValueKind.ARRAY) {
    return value.toArray();
  }
  return [];
}
