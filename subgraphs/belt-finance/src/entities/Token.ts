import { Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/beltBTC/ERC20";
import { RewardToken, Token } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, DEFAULT_DECIMALS, RewardTokenType } from "../constant";
import { readValue } from "../utils/contracts";

export function getOrCreateToken(id: Address): Token {
  let token = Token.load(id.toHex());

  if (token) {
    return token;
  }

  token = new Token(id.toHex());

  let erc20Contract = ERC20.bind(id);
  token.name = readValue<string>(erc20Contract.try_name(), "");
  token.symbol = readValue<string>(erc20Contract.try_symbol(), "");
  token.decimals = readValue<i32>(erc20Contract.try_decimals(), DEFAULT_DECIMALS);
  token.lastPriceUSD = BIGDECIMAL_ZERO;
  token.lastPriceBlockNumber = BIGINT_ZERO;
  token.save();

  return token;
}

export function getOrCreateReward(id: Address): RewardToken {
  let reward = RewardToken.load(id.toHex());

  if (reward) {
    return reward;
  }

  reward = new RewardToken(id.toHex());

  reward.token = getOrCreateToken(id).id;
  reward.type = RewardTokenType.DEPOSIT;
  reward.save();

  return reward;
}
