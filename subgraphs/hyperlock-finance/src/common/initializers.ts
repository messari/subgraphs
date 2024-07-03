import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Pricer, TokenInit, readValue } from "../common/utils";
import { ThrusterV2 } from "../../generated/ERC20PointsDeposit/ThrusterV2";
import { ERC20PointsDeposit } from "../../generated/ERC20PointsDeposit/ERC20PointsDeposit";

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

export function getOrCreateV2Pool(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const inputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    const poolContract = ThrusterV2.bind(poolAddress);

    const token0 = sdk.Tokens.getOrCreateToken(
      readValue<Address>(poolContract.try_token0(), constants.NULL.TYPE_ADDRESS)
    );
    const token1 = sdk.Tokens.getOrCreateToken(
      readValue<Address>(poolContract.try_token1(), constants.NULL.TYPE_ADDRESS)
    );

    const poolName = token0.name.concat(" / ").concat(token1.name);
    const poolsymbol = token0.symbol.concat(" / ").concat(token1.symbol);

    pool.initialize(poolName, poolsymbol, [inputToken.id], null);
  }

  return pool;
}

export function getOrCreateV3Pool(poolAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(poolAddress);

  if (!pool.isInitialized) {
    const inputToken = sdk.Tokens.getOrCreateToken(poolAddress);

    const poolContract = ThrusterV2.bind(poolAddress);

    const token0 = sdk.Tokens.getOrCreateToken(
      readValue<Address>(poolContract.try_token0(), constants.NULL.TYPE_ADDRESS)
    );
    const token1 = sdk.Tokens.getOrCreateToken(
      readValue<Address>(poolContract.try_token1(), constants.NULL.TYPE_ADDRESS)
    );

    const poolName = token0.name.concat(" / ").concat(token1.name);
    const poolsymbol = token0.symbol.concat(" / ").concat(token1.symbol);

    pool.initialize(poolName, poolsymbol, [inputToken.id], null);
  }

  return pool;
}

export function updatePoolTVL(pool: Pool, amount: BigInt): void {
  const v2DepositsContract = ERC20PointsDeposit.bind(
    Address.fromBytes(pool.getBytesID())
  );

  pool.setInputTokenBalances([tvlCall.value.value2], true);
}
