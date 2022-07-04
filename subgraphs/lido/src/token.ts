import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Token, RewardToken } from '../generated/schema';
import { RewardTokenType } from "./utils/constants";
import { ERC20 } from '../generated/Lido/ERC20';
import { bigIntToBigDecimal } from "./utils/numbers";
import { ETH_ADDRESS, ETH_NAME, ETH_SYMBOL } from "./utils/constants";


export function getOrCreateToken(
  tokenAddress: Address,
): Token {
  const tokenId = tokenAddress.toHexString();
  let token = Token.load(tokenId);

  if (!token) {
    token = new Token(tokenId);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;

  }

  return token;
}

export function getOrCreateRewardToken(address: Address): RewardToken {
  let rewardTokenId = address.toHexString();
  let rewardToken = RewardToken.load(rewardTokenId);

  if (!rewardToken) {
    let token = getOrCreateToken(address);
    rewardToken = new RewardToken(rewardTokenId);

    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;

    rewardToken.save();
  }
  return rewardToken as RewardToken;
}

function fetchTokenName(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_name();
  if (call.reverted) {
    return tokenAddress.toHexString();
  } else {
    return call.value;
  }
}

function fetchTokenSymbol(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_symbol();
  if (call.reverted) {
    return " ";
  } else {
    return call.value;
  }
}

function fetchTokenDecimals(tokenAddress: Address): number {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_decimals();
  if (call.reverted) {
    return 0;
  } else {
    return call.value;
  }
}