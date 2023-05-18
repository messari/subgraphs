import { Address, BigDecimal, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/BasicWeeklyCalls/ERC20";
import { Token, RewardToken } from "../../generated/schema";
import { getUsdPricePerToken } from "../prices";
import {
  BIGDECIMAL_ZERO,
  RewardTokenType,
  PRICE_CACHING_BLOCKS,
  INT_ZERO,
} from "../utils/constants";

export function getOrCreateToken(
  event: ethereum.Event,
  tokenAddress: Address,
  getPrice: boolean = true
): Token {
  let token = Token.load(tokenAddress);

  if (!token) {
    token = new Token(tokenAddress);

    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress) as i32;
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = event.block.number;
    token.save();
  }

  if (!getPrice) {
    return token;
  }

  if (
    token.lastPriceUSD &&
    token.lastPriceBlockNumber &&
    event.block.number
      .minus(token.lastPriceBlockNumber!)
      .lt(PRICE_CACHING_BLOCKS)
  ) {
    return token;
  }

  // Optional lastPriceUSD and lastPriceBlockNumber, but used in financialMetrics
  const price = getUsdPricePerToken(tokenAddress, event.block);
  if (!price.reverted) {
    token.lastPriceUSD = price.usdPrice;
  }

  token.lastPriceBlockNumber = event.block.number;
  token.save();

  return token;
}

export function updateTokenPrice(
  event: ethereum.Event,
  token: Token,
  tokenPriceUSD: BigDecimal
): void {
  token.lastPriceUSD = tokenPriceUSD;
  token.lastPriceBlockNumber = event.block.number;
  token.save();
}

export function getOrCreateRewardToken(
  event: ethereum.Event,
  address: Address
): RewardToken {
  const id = Bytes.fromI32(INT_ZERO).concat(address);
  let rewardToken = RewardToken.load(id);
  if (!rewardToken) {
    const token = getOrCreateToken(event, address);
    rewardToken = new RewardToken(id);
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType.DEPOSIT;
    rewardToken.save();
  }
  return rewardToken;
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
