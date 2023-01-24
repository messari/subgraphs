import { Address, BigInt } from "@graphprotocol/graph-ts";
import { RewardToken, Token } from "../../generated/schema";
import { ERC20 } from "../../generated/GlpManager/ERC20";
import { getUsdPricePerToken } from "../prices";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  GLP_SYMBOL,
  PRICE_CACHING_BLOCKS,
  USDG_SYMBOL,
} from "../utils/constants";
import { prefixID } from "../utils/strings";

export function getOrCreateToken(
  tokenAddress: Address,
  blockNumber: BigInt
): Token {
  const tokenId = tokenAddress.toHexString();
  let token = Token.load(tokenId);

  if (!token) {
    token = new Token(tokenId);

    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;

    token.save();
  }

  // GLP price will be computed elsewhere.
  if (token.symbol == GLP_SYMBOL) {
    return token;
  }

  // Optional lastPriceUSD and lastPriceBlockNumber, but used in financialMetrics
  if (
    !token.lastPriceUSD ||
    !token.lastPriceBlockNumber ||
    blockNumber.minus(token.lastPriceBlockNumber!).gt(PRICE_CACHING_BLOCKS)
  ) {
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = blockNumber;

    if (token.symbol == USDG_SYMBOL) {
      // There is not price info from Oracle for some tokens, so not to try to get price for them here.
      token.lastPriceUSD = BIGDECIMAL_ONE;
    } else {
      const price = getUsdPricePerToken(tokenAddress);
      if (!price.reverted) {
        token.lastPriceUSD = price.usdPrice;
      }
    }

    token.save();
  }

  return token;
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

export function getOrCreateRewardToken(
  tokenAddress: Address,
  rewardTokenType: string,
  blockNumber: BigInt
): RewardToken {
  const id = prefixID(rewardTokenType, tokenAddress.toHexString());
  let rewardToken = RewardToken.load(id);
  if (!rewardToken) {
    rewardToken = new RewardToken(id);
    rewardToken.type = rewardTokenType;
    rewardToken.token = getOrCreateToken(tokenAddress, blockNumber).id;
  }
  rewardToken.save();
  return rewardToken;
}

export function getRewardTokenById(id: string): RewardToken {
  return RewardToken.load(id)!;
}
