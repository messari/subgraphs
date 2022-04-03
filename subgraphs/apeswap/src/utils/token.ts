import { Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Factory/ERC20";
import { Token } from "../../generated/schema";
import { BIGINT_ZERO, ZERO_ADDRESS } from "./constant";

export function getOrCreateToken(address: Address): Token {
  // Check if token already exist
  let token = Token.load(address.toHexString());

  // If token doesn't exist, create a new token
  if (token == null && address !== Address.fromString(ZERO_ADDRESS)) {
    token = new Token(address.toHexString());

    let tokenInstance = ERC20.bind(address);
    let tryName = tokenInstance.try_name();
    if (!tryName.reverted) {
      token.name = tryName.value;
    }
    let trySymbol = tokenInstance.try_symbol();
    if (!trySymbol.reverted) {
      token.symbol = trySymbol.value;
    }
    let tryDecimals = tokenInstance.try_decimals();
    if (!tryDecimals.reverted) {
      token.decimals = tryDecimals.value;
    }
    let tryTotalSupply = tokenInstance.try_totalSupply();
    if (!tryTotalSupply.reverted) {
      token.totalSupply = tryTotalSupply.value;
    }
    token.tradeVolume = BIGINT_ZERO;
    token.tradeVolumeUSD = BIGINT_ZERO;
    token.untrackedVolumeUSD = BIGINT_ZERO;
    token.txCount = BIGINT_ZERO;
    token.totalLiquidity = BIGINT_ZERO;
    token.derivedBNB = BIGINT_ZERO;

    token.save();
    return token as Token;
  }
  return token as Token;
}

