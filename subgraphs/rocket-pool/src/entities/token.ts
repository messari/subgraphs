import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { Token, RewardToken } from "../../generated/schema";
import { ERC20 } from "../../generated/rocketVault/ERC20";
import { RETH } from "../../generated/rocketVault/RETH";
import { getUsdPricePerToken } from "../prices";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  BIGDECIMAL_ZERO,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  RETH_ADDRESS,
  ONE_ETH_IN_WEI,
  BIGDECIMAL_ONE,
} from "../utils/constants";

export function getOrCreateToken(
  tokenAddress: Address,
  blockNumber: BigInt
): Token {
  const tokenId = tokenAddress.toHexString();
  let token = Token.load(tokenId);

  if (!token) {
    token = new Token(tokenId);

    if (tokenAddress == Address.fromString(ETH_ADDRESS)) {
      token.name = ETH_NAME;
      token.symbol = ETH_SYMBOL;
      token.decimals = 18;
    } else {
      token.name = fetchTokenName(tokenAddress);
      token.symbol = fetchTokenSymbol(tokenAddress);
      token.decimals = fetchTokenDecimals(tokenAddress) as i32;
    }
  }

  // Optional lastPriceUSD and lastPriceBlockNumber, but used in financialMetrics
  // if (tokenAddress.equals(Address.fromString(RETH_ADDRESS))) {
  //   let rethpriceUSD: BigDecimal | null = null;
  //   rethpriceUSD = getRETHpriceUSD(
  //     Address.fromString(RETH_ADDRESS),
  //     blockNumber
  //   );
  //   log.warning("[getOrCreateToken]rethPriceUSD call result: {} ", [
  //     rethpriceUSD.toString(),
  //   ]);

  //   token.lastPriceUSD = rethpriceUSD;
  //   token.lastPriceBlockNumber = blockNumber;
  //   token.save();

  //   return token;
  // }
  if (
    token.lastPriceBlockNumber &&
    token.lastPriceBlockNumber!.equals(blockNumber)
  ) {
    token.save();
    return token;
  }
  let price = getUsdPricePerToken(tokenAddress);

  if (price.reverted) {
    token.lastPriceUSD = BIGDECIMAL_ZERO;
  } else {
    token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
  }

  token.lastPriceBlockNumber = blockNumber;
  token.save();

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
  address: Address,
  type: string,
  blocknumber: BigInt
): RewardToken {
  let token = getOrCreateToken(address, blocknumber);

  let rewardTokenId = `${token.id}-${type}`;
  let rewardToken = RewardToken.load(rewardTokenId);
  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenId);
    rewardToken.token = token.id;
    rewardToken.type = type;
    rewardToken.save();
  }
  return rewardToken;
}
