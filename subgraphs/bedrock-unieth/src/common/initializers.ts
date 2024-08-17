import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { ERC20 } from "../../generated/Staking/ERC20";
import { Pricer, TokenInit, readValue } from "./utils";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Staking } from "../../generated/Staking/Staking";
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

export function initializeSDKFromCall(call: ethereum.Call): SDK {
  const protocolConfig = new ProtocolConfig(
    constants.Protocol.ID,
    constants.Protocol.NAME,
    constants.Protocol.SLUG,
    Versions
  );
  const tokenPricer = new Pricer();
  const tokenInitializer = new TokenInit();

  const sdk = SDK.initializeFromCall(
    protocolConfig,
    tokenPricer,
    tokenInitializer,
    call
  );

  return sdk;
}

export function getOrCreatePool(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const outputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [Address.fromString(constants.WETH_ADDRESS)],
      outputToken
    );
  }

  return pool;
}

export function updatePoolTVL(pool: Pool): void {
  const tokenContract = ERC20.bind(
    Address.fromString(constants.UNIETH_ADDRESS)
  );

  const totalSupply = readValue<BigInt>(
    tokenContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  const stakingContract = Staking.bind(
    Address.fromString(constants.STAKING_ADDRESS)
  );
  const exchangeRatio = readValue<BigInt>(
    stakingContract.try_exchangeRatio(),
    constants.BIGINT_ZERO
  );

  const poolTVL = totalSupply.times(
    exchangeRatio.div(constants.BIGINT_TEN_TO_EIGHTEENTH)
  );

  pool.setInputTokenBalances([poolTVL], true);
}

export function updatePoolOutputTokenSupply(pool: Pool): void {
  const contract = ERC20.bind(Address.fromBytes(pool.getBytesID()));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}
