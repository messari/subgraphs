import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { Pricer, TokenInit, readValue } from "./utils";
import { ProtocolConfig } from "../sdk/protocols/config";
import { Vault } from "../../generated/UnionVault/Vault";
import { VaultV2 } from "../../generated/UnionVault/VaultV2";
import { Address, ethereum } from "@graphprotocol/graph-ts";

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
    const vaultContract = Vault.bind(poolAddress);

    let inputTokenAddress = readValue<Address>(
      vaultContract.try_underlying(),
      constants.NULL.TYPE_ADDRESS
    );

    if (inputTokenAddress.equals(constants.NULL.TYPE_ADDRESS)) {
      const vaultV2Contract = VaultV2.bind(poolAddress);

      inputTokenAddress = readValue<Address>(
        vaultV2Contract.try_asset(),
        constants.NULL.TYPE_ADDRESS
      );
    }

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
