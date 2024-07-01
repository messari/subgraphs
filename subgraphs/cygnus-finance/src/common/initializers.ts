import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { CGUSD } from "../../generated/CGUSD/CGUSD";
import { ERC20 } from "../../generated/CGUSD/ERC20";
import { Pool } from "../sdk/protocols/generic/pool";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Pricer, TokenInit, readValue } from "../common/utils";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function initializeSDKFromEvent(event: ethereum.Event): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.Protocol.ID,
    constants.Protocol.NAME,
    constants.Protocol.SLUG,
    Versions
  );
  const tokenPricer = new Pricer();
  const tokenInitializer = new TokenInit();

  const sdk = SDK.initializeFromEvent(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    event
  );

  return sdk;
}

export function getOrCreatePool(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const poolContract = CGUSD.bind(poolAddress);

    const inputTokenAddress = readValue<Address>(
      poolContract.try_asset(),
      Address.fromString(constants.ZERO_ADDRESS)
    );

    const inputToken = sdk.Tokens.getOrCreateToken(inputTokenAddress);
    const outputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [inputToken.id],
      outputToken
    );
  }

  return pool;
}

export function updatePoolTVL(pool: Pool): void {
  const poolContract = CGUSD.bind(Address.fromBytes(pool.getBytesID()));

  const tvl = readValue<BigInt>(
    poolContract.try_getTotalPooledAssets(),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([tvl], true);
}

export function updatePoolOutputTokenSupply(pool: Pool): void {
  const contract = ERC20.bind(Address.fromString(constants.CGUSD_ADDRESS));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}
