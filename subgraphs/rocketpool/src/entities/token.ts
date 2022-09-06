import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
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
  let rethpriceUSD: BigDecimal | null = null;
  if (tokenAddress == Address.fromString(RETH_ADDRESS)) {
    rethpriceUSD = getRETHpriceUSD(
      Address.fromString(RETH_ADDRESS),
      blockNumber
    );
    log.warning("[getOrCreateToken]rethPriceUSD call result: {} ", [
      rethpriceUSD.toString(),
    ]);
  }
  let price = getUsdPricePerToken(tokenAddress);

  if (price.reverted) {
    token.lastPriceUSD = BIGDECIMAL_ZERO;
  } else {
    token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
  }
  if (rethpriceUSD) {
    token.lastPriceUSD = rethpriceUSD;
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

function getRETHpriceUSD(
  tokenAddress: Address,
  blockNumber: BigInt
): BigDecimal {
  const RETHContract = RETH.bind(tokenAddress);

  const rethCall = RETHContract.try_getRethValue(ONE_ETH_IN_WEI);
  let RETHratio = BIGDECIMAL_ZERO;
  let RETHpriceUSD = BIGDECIMAL_ZERO;
  if (rethCall.reverted) {
    log.error("rethCall Reverted", []);
  } else {
    RETHratio = bigIntToBigDecimal(rethCall.value.div(ONE_ETH_IN_WEI));
  }

  let ETH = getOrCreateToken(Address.fromString(ETH_ADDRESS), blockNumber);
  let ethPriceUSD = ETH.lastPriceUSD;

  if (ethPriceUSD) {
    RETHpriceUSD = ethPriceUSD.times(RETHratio);
  }

  return RETHpriceUSD;
}
