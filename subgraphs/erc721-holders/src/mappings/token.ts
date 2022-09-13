import { BigInt } from "@graphprotocol/graph-ts";
import { ERC721 } from "../../generated/ERC721/ERC721";
import { Token, Collection } from "../../generated/schema";

export function normalize(strValue: string): string {
  if (strValue.length == 1 && strValue.charCodeAt(0) == 0) {
    return "";
  }

  for (let i = 0; i < strValue.length; i++) {
    if (strValue.charCodeAt(i) == 0) {
      // graph-node db does not support string with '\u0000'
      strValue = strValue.substr(0, i) + "\ufffd" + strValue.substr(i + 1);
    }
  }
  return strValue;
}

export function getOrCreateToken(
  contract: ERC721,
  tokenCollection: Collection,
  tokenId: BigInt,
  timestamp: BigInt
): Token {
  let contractTokenId = tokenCollection.id + "-" + tokenId.toString();
  let existingToken = Token.load(contractTokenId);

  if (existingToken != null) {
    return existingToken as Token;
  }

  let newToken = new Token(contractTokenId);
  newToken.collection = tokenCollection.id;
  newToken.tokenID = tokenId;
  newToken.mintTime = timestamp;
  if (tokenCollection.supportsERC721Metadata) {
    let metadataURI = contract.try_tokenURI(tokenId);
    if (!metadataURI.reverted) {
      newToken.tokenURI = normalize(metadataURI.value);
    }
  }

  return newToken;
}
