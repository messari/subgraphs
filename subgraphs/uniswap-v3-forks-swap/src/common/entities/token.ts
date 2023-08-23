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
    token = new Token(address);
    let name = "";
    let symbol = "";
    let decimals = DEFAULT_DECIMALS;

    if (!NetworkConfigs.getBrokenERC20Tokens().includes(address)) {
      const erc20Contract = ERC20.bind(Address.fromBytes(address));
      // TODO: add overrides for name and symbol
      const nameCall = erc20Contract.try_name();
      if (!nameCall.reverted) name = nameCall.value;
      const symbolCall = erc20Contract.try_symbol();
      if (!symbolCall.reverted) symbol = symbolCall.value;
      const decimalsCall = erc20Contract.try_decimals();
      if (!decimalsCall.reverted) decimals = decimalsCall.value;
    }

    if (
      token.id ==
        Address.fromHexString(
          "0x82af49447d8a07e3bd95bd0d56f35241523fbab1".toLowerCase()
        ) &&
      NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
    ) {
      name = "WETH";
      symbol = "WETH";
      decimals = DEFAULT_DECIMALS;
    }

    token.name = name;
    token.symbol = symbol;
    token.decimals = decimals;
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
