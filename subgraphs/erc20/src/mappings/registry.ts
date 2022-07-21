import {
  Address,
  JSONValue,
  Value,
  log,
  ipfs,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";

import { Token } from "../../generated/schema";
import { ERC20 } from "../../generated/TokenRegistry/ERC20";
import { Unknown as UnknownEvent } from "../../generated/TokenRegistry/TokenRegistry";

import {
  BurnableToken,
  MintableToken,
  StandardToken,
} from "../../generated/templates";

import {
  REGISTRY_HASH,
  DEFAULT_DECIMALS,
  BIGINT_ZERO,
  BIGDECIMAL_ZERO,
} from "../common/constants";

export function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal();

  return value.divDecimal(precision);
}

export function initTokenList(event: UnknownEvent): void {
  log.debug("Initializing token registry, block={}", [
    event.block.number.toString(),
  ]);

  ipfs.mapJSON(REGISTRY_HASH, "createToken", Value.fromString(""));
}

export function createToken(value: JSONValue, userData: Value): void {
  let rawData = value.toArray();

  let address = rawData[0].isNull() ? "" : rawData[0].toString();
  let symbol = rawData[1].isNull() ? "" : rawData[1].toString();

  if (address != null) {
    let contractAddress = Address.fromString(address);

    // Persist token data if it didn't exist
    let token = Token.load(contractAddress.toHex());
    if (token == null) {
      token = new Token(contractAddress.toHex());
      token.name = "";
      token.symbol = symbol;
      token.decimals = DEFAULT_DECIMALS;

      token.currentHolderCount = BIGINT_ZERO;
      token.cumulativeHolderCount = BIGINT_ZERO;
      token.transferCount = BIGINT_ZERO;
      token.mintCount = BIGINT_ZERO;
      token.burnCount = BIGINT_ZERO;
      token.totalSupply = BIGDECIMAL_ZERO;
      token.totalBurned = BIGDECIMAL_ZERO;
      token.totalMinted = BIGDECIMAL_ZERO;

      log.debug("Adding token to registry, symbol: {}, address: {}", [
        token.symbol,
        token.id,
      ]);

      token.save();

      // Start indexing token events
      StandardToken.create(contractAddress);
      BurnableToken.create(contractAddress);
      MintableToken.create(contractAddress);
    } else {
      log.warning("Token {} already in registry", [contractAddress.toHex()]);
    }
  }
}
