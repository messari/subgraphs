import { Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Factory/ERC20";
import { RewardToken, Token } from "../../generated/schema";
import { BIGDECIMAL_ZERO, RewardTokenType, ZERO_ADDRESS } from "./constant";

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
    token._derivedNativeToken = BIGDECIMAL_ZERO;
    token.save();

    return token as Token;
  }
  return token as Token;
}

export function getOrCreateRewardToken(address: Address): RewardToken {
  let rewardToken = RewardToken.load(address.toHexString());
  if (rewardToken == null) {
    let token = getOrCreateToken(address);
    rewardToken = new RewardToken(address.toHexString());
    rewardToken.name = token.name;
    rewardToken.symbol = token.symbol;
    rewardToken.decimals = token.decimals;
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.save();

    return rewardToken as RewardToken;
  }
  return rewardToken as RewardToken;
}
