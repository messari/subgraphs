import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { Pricer, TokenInit, readValue } from "./utils";
import { MLRT } from "../../generated/EigenConfig/MLRT";
import { ProtocolConfig } from "../sdk/protocols/config";
import { ERC20 } from "../../generated/EigenConfig/ERC20";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { EigenStaking } from "../../generated/EigenConfig/EigenStaking";

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
    const poolContract = MLRT.bind(poolAddress);

    const inputToken = readValue<Address>(
      poolContract.try_underlyingAsset(),
      constants.NULL.TYPE_ADDRESS
    );
    const outputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [inputToken],
      outputToken
    );
  }

  return pool;
}

export function updatePoolTVL(pool: Pool, asset: Address): void {
  const stakingContract = EigenStaking.bind(
    Address.fromString(constants.EIGEN_STAKING_ADDRESS)
  );

  const poolUnderlyingTVL = readValue<BigInt>(
    stakingContract.try_getTotalAssetDeposits(asset),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([poolUnderlyingTVL], true);
}

export function updatePoolOutputTokenSupply(pool: Pool): void {
  const contract = ERC20.bind(Address.fromBytes(pool.getBytesID()));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}
