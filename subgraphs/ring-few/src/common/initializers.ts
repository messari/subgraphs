import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { Pricer, TokenInit, readValue } from "./utils";
import { ProtocolConfig } from "../sdk/protocols/config";
import { ERC20 } from "../../generated/FewFactory/ERC20";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { FewWrappedToken } from "../../generated/templates/FewWrappedToken/FewWrappedToken";

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

export function getOrCreatePool(vaultAddress: Address, sdk: SDK): Pool {
  const pool = sdk.Pools.loadPool(vaultAddress);

  if (!pool.isInitialized) {
    const vaultContract = FewWrappedToken.bind(
      Address.fromBytes(pool.getBytesID())
    );

    const inputToken = sdk.Tokens.getOrCreateToken(
      readValue<Address>(
        vaultContract.try_token(),
        Address.fromString(constants.ZERO_ADDRESS)
      )
    );
    const outputToken = sdk.Tokens.getOrCreateToken(vaultAddress);

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
  const inputTokenAddress = Address.fromBytes(pool.pool.inputTokens[0]);
  const tokenContract = ERC20.bind(inputTokenAddress);

  const poolTVL = readValue<BigInt>(
    tokenContract.try_balanceOf(Address.fromBytes(pool.getBytesID())),
    constants.BIGINT_ZERO
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
