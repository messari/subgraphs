import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/ControllerListener/ERC20";
import { RewardToken, Token } from "../../generated/schema";
import * as constants from "../constant";
import { readValue } from "../utils/contracts";

export function getOrCreateToken(id: Address): Token {
  let token = Token.load(id.toHex());

  if (token) {
    return token as Token;
  }

  token = new Token(id.toHex());

  let erc20Contract = ERC20.bind(id);
  token.name = readValue<string>(erc20Contract.try_name(), "");
  token.symbol = readValue<string>(erc20Contract.try_symbol(), "");
  token.decimals = (readValue<BigInt>(erc20Contract.try_decimals(), constants.BIGINT_ZERO)).toI32();
  token.save();

  return token as Token;
}

export function getOrCreateReward(id: Address): RewardToken {
  let token = RewardToken.load(id.toHex());

  if (token) {
    return token;
  }

  token = new RewardToken(id.toHex());

  let erc20Contract = ERC20.bind(id);
  token.name = readValue<string>(erc20Contract.try_name(), "");
  token.symbol = readValue<string>(erc20Contract.try_symbol(), "");
  token.decimals = (readValue<BigInt>(erc20Contract.try_decimals(), constants.BIGINT_ZERO)).toI32();
  token.type = RewardTokenType.DEPOSIT;
  token.save();

  return token;
}
