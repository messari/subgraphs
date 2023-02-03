import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { ERC20 } from "../../generated/Notional/ERC20";
import { getUsdPricePerToken } from "../prices";
import {
  BIGDECIMAL_ZERO,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
} from "../common/constants";

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
      token.name = _fetchTokenName(tokenAddress);
      token.symbol = _fetchTokenSymbol(tokenAddress);
      token.decimals = _fetchTokenDecimals(tokenAddress) as i32;
    }
  }

  // Optional lastPriceUSD and lastPriceBlockNumber, but used in financialMetrics
  if (
    !token.lastPriceBlockNumber ||
    token.lastPriceBlockNumber! != blockNumber
  ) {
    const price = getUsdPricePerToken(tokenAddress);
    if (price.reverted) {
      token.lastPriceUSD = BIGDECIMAL_ZERO;
    } else {
      token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
    }
    token.lastPriceBlockNumber = blockNumber;
    token.save();
  }

  return token;
}

export function getOrCreateERC1155Token(
  tokenAddress: string,
  encodedId: BigInt
): Token {
  const tokenId = "ERC1155-" + tokenAddress + "-" + encodedId.toString();
  let token = Token.load(tokenId);

  if (!token) {
    token = new Token(tokenId);
    token.save();
  }

  return token;
}

function _fetchTokenName(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_name();
  if (call.reverted) {
    return tokenAddress.toHexString();
  } else {
    return call.value;
  }
}

function _fetchTokenSymbol(tokenAddress: Address): string {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_symbol();
  if (call.reverted) {
    return " ";
  } else {
    return call.value;
  }
}

function _fetchTokenDecimals(tokenAddress: Address): number {
  const tokenContract = ERC20.bind(tokenAddress);
  const call = tokenContract.try_decimals();
  if (call.reverted) {
    return 0;
  } else {
    return call.value;
  }
}
