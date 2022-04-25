import { Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/bveCVX/ERC20";
import { RewardToken, Token } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, DEFAULT_DECIMALS, RewardTokenType } from "../constant";
import { readValue } from "../utils/contracts";
import { enumToPrefix } from "../utils/strings";

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
  let _id = enumToPrefix(RewardTokenType.DEPOSIT)
    .concat("-")
    .concat(id.toHex());
  let reward = RewardToken.load(_id);

  if (reward) {
    return reward;
  }

  let token = getOrCreateToken(id);
  reward = new RewardToken(_id);

  reward.token = token.id;
  reward.type = RewardTokenType.DEPOSIT;
  reward.save();

  return reward;
}
