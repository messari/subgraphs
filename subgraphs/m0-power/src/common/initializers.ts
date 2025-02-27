import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { ERC20 } from "../../generated/Minter/ERC20";
import { Minter } from "../../generated/Minter/Minter";
import { Pricer, TokenInit, readValue } from "./utils";
import { ProtocolConfig } from "../sdk/protocols/config";
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
    const minterContract = Minter.bind(poolAddress);
    const outputTokenAddress = readValue<Address>(
      minterContract.try_mToken(),
      constants.NULL.TYPE_ADDRESS
    );

    const outputToken = sdk.Tokens.getOrCreateToken(outputTokenAddress);

    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [Address.fromString(constants.USDC_ADDRESS)],
      outputToken
    );
  }

  return pool;
}

export function updatePoolTVL(pool: Pool, inputTokenSupply: BigInt): void {
  pool.setInputTokenBalances([inputTokenSupply], true);
}

export function updatePoolOutputTokenSupply(pool: Pool): void {
  const contract = ERC20.bind(Address.fromBytes(pool.getBytesID()));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}
