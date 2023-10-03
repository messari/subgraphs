import { Address, BigInt } from "@graphprotocol/graph-ts";

import { NetworkConfigs } from "../../configurations/configure";
import { Versions } from "../versions";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  INT_ZERO,
  MAX_INT32,
  ProtocolType,
} from "./constants";

import { DexAmmProtocol, LiquidityPool, Token } from "../../generated/schema";
import { TokenABI as ERC20 } from "../../generated/Factory/TokenABI";

export function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new DexAmmProtocol(NetworkConfigs.getFactoryAddress());
    protocol.name = NetworkConfigs.getProtocolName();
    protocol.slug = NetworkConfigs.getProtocolSlug();
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalPoolCount = INT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  protocol.save();

  return protocol;
}

export function getLiquidityPool(poolAddress: string): LiquidityPool {
  const pool = LiquidityPool.load(poolAddress)!;
  return pool;
}

export function getOrCreateToken(address: string): Token {
  let token = Token.load(address);
  if (!token) {
    token = new Token(address);
    let name = "";
    let symbol = "";
    let decimals = DEFAULT_DECIMALS;

    if (
      !NetworkConfigs.getBrokenERC20Tokens().includes(address.toLowerCase())
    ) {
      const erc20Contract = ERC20.bind(Address.fromString(address));
      // TODO: add overrides for name and symbol
      const nameCall = erc20Contract.try_name();
      if (!nameCall.reverted) name = nameCall.value;
      const symbolCall = erc20Contract.try_symbol();
      if (!symbolCall.reverted) symbol = symbolCall.value;
      const decimalsCall = erc20Contract.try_decimals();
      if (!decimalsCall.reverted)
        decimals = BigInt.fromString(decimalsCall.value.toString()).isI32()
          ? decimalsCall.value
          : MAX_INT32.toI32();
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

    token.save();
  }

  return token as Token;
}

export function getOrCreateLPToken(
  tokenAddress: string,
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
    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.lastPriceBlockNumber = BIGINT_ZERO;
    token._totalSupply = BIGINT_ZERO;
    token._totalValueLockedUSD = BIGDECIMAL_ZERO;
    token._largeTVLImpactBuffer = 0;
    token._largePriceChangeBuffer = 0;
    token.save();
  }
  return token;
}
