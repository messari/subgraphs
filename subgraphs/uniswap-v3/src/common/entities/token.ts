import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../configurations/configure";
import { ERC20 } from "../../../generated/Factory/ERC20";
import { Token, _TokenWhitelist } from "../../../generated/schema";
import {
  DEFAULT_DECIMALS,
  Network,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
} from "../constants";
import {
  findUSDPricePerToken,
  sqrtPriceX96ToTokenPrices,
} from "../price/price";
import { getLiquidityPoolAmounts } from "./pool";

export function getOrCreateToken(
  event: ethereum.Event,
  address: Bytes,
  getNewPrice: boolean = true
): Token {
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
          "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase()
        ) &&
      NetworkConfigs.getNetwork() == Network.ARBITRUM_ONE
    ) {
      token.name = "WETH";
      token.symbol = "WETH";
      token.decimals = DEFAULT_DECIMALS;
    }
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;

    // Fixing token fields that did not return proper values from contract
    // Manually coded in when necessary
    token = fixTokenFields(token);

    token.save();
  }

  if (token.lastPriceBlockNumber != event.block.number && getNewPrice) {
    token.lastPriceUSD = findUSDPricePerToken(event, token);
    token.lastPriceBlockNumber = event.block.number;
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

export function getOrCreateTokenWhitelist(
  tokenAddress: Bytes
): _TokenWhitelist {
  let tokenTracker = _TokenWhitelist.load(tokenAddress);
  // fetch info if null
  if (!tokenTracker) {
    tokenTracker = new _TokenWhitelist(tokenAddress);

    tokenTracker.whitelistPools = [];
    tokenTracker.save();
  }

  return tokenTracker;
}

// These whiteslists are used to track what pools the tokens are a part of. Used in price calculations.
export function updateTokenWhitelists(
  token0: Token,
  token1: Token,
  poolAddress: Bytes
): void {
  const tokenWhitelist0 = getOrCreateTokenWhitelist(token0.id);
  const tokenWhitelist1 = getOrCreateTokenWhitelist(token1.id);

  // update white listed pools
  if (NetworkConfigs.getWhitelistTokens().includes(tokenWhitelist0.id)) {
    const newPools = tokenWhitelist1.whitelistPools;
    newPools.push(poolAddress);
    tokenWhitelist1.whitelistPools = newPools;
    tokenWhitelist1.save();
  }

  if (NetworkConfigs.getWhitelistTokens().includes(tokenWhitelist1.id)) {
    const newPools = tokenWhitelist0.whitelistPools;
    newPools.push(poolAddress);
    tokenWhitelist0.whitelistPools = newPools;
    tokenWhitelist0.save();
  }
}

export function updateTokenPrices(
  event: ethereum.Event,
  sqrtPriceX96: BigInt
): void {
  const poolAmounts = getLiquidityPoolAmounts(event.address)!;
  const token0 = getOrCreateToken(event, poolAmounts.inputTokens[INT_ZERO]);
  const token1 = getOrCreateToken(event, poolAmounts.inputTokens[INT_ONE]);

  poolAmounts.tokenPrices = sqrtPriceX96ToTokenPrices(
    sqrtPriceX96,
    token0 as Token,
    token1 as Token
  );
  poolAmounts.save();
}

function fixTokenFields(token: Token): Token {
  // Arbitrum
  if (
    token.id ==
      Address.fromHexString(
        "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase()
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
