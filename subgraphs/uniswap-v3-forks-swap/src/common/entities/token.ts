import { Address, Bytes } from "@graphprotocol/graph-ts";

import { NetworkConfigs } from "../../../configurations/configure";
import {
  DEFAULT_DECIMALS,
  Network,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
} from "../constants";

import { ERC20 } from "../../../generated/Factory/ERC20";
import { Token } from "../../../generated/schema";

export function getOrCreateToken(address: Bytes): Token {
  let token = Token.load(address);
  if (!token) {
    token = new Token(address);
    const erc20Contract = ERC20.bind(Address.fromBytes(address));
    const decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    const name = erc20Contract.try_name();
    const symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? "" : name.value;
    token.symbol = symbol.reverted ? "" : symbol.value;
    if (
      token.id ==
        Address.fromHexString(
          "0x82af49447d8a07e3bd95bd0d56f35241523fbab1".toLowerCase()
        ) &&
      NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
    ) {
      token.name = "WETH";
      token.symbol = "WETH";
      token.decimals = DEFAULT_DECIMALS;
    }
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;

    token._totalSupply = BIGINT_ZERO;
    token._totalValueLockedUSD = BIGDECIMAL_ZERO;
    token._largeTVLImpactBuffer = 0;
    token._largePriceChangeBuffer = 0;

    // Fixing token fields that did not return proper values from contract
    // Manually coded in when necessary
    token = fixTokenFields(token);

    token.save();
  }

  return token as Token;
}

export function getOrCreateLPToken(
  tokenAddress: Bytes,
  token0: Token,
  token1: Token
): Token {
  let token = Token.load(tokenAddress);
  // fetch info if null
  if (token === null) {
    token = new Token(tokenAddress);
    token.symbol = token0.name + "/" + token1.name;
    token.name = token0.name + "/" + token1.name + " LP";
    token.decimals = DEFAULT_DECIMALS;
    token.save();
  }
  return token;
}

function fixTokenFields(token: Token): Token {
  // Arbitrum
  if (
    token.id ==
      Address.fromHexString(
        "0x82af49447d8a07e3bd95bd0d56f35241523fbab1".toLowerCase()
      ) &&
    NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
  ) {
    token.name = "WETH";
    token.symbol = "WETH";
    token.decimals = DEFAULT_DECIMALS;
  }

  if (
    token.id ==
      Address.fromHexString(
        "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8".toLowerCase()
      ) &&
    NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
  ) {
    token.name = "USDC";
    token.symbol = "USDC";
  }

  if (
    token.id ==
      Address.fromHexString(
        "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9".toLowerCase()
      ) &&
    NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
  ) {
    token.name = "USDT";
    token.symbol = "USDT";
  }

  return token;
}
