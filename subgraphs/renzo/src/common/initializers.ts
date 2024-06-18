import { Versions } from "../versions";
import { SDK } from "../sdk/protocols/generic";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { ProtocolConfig } from "../sdk/protocols/config";
import { ERC20 } from "../../generated/RestakeManager/ERC20";
import { Pricer, TokenInit, readValue } from "../common/utils";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { DepositQueue } from "../../generated/RestakeManager/DepositQueue";
import { RestakeManager } from "../../generated/RestakeManager/RestakeManager";

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
    const inputToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.ETH_ADDRESS)
    );
    const outputToken = sdk.Tokens.getOrCreateToken(
      Address.fromString(constants.EZETH_ADDRESS)
    );

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
  const poolContract = RestakeManager.bind(
    Address.fromBytes(pool.getBytesID())
  );

  const tvlCall = poolContract.try_calculateTVLs();
  if (tvlCall.reverted) return;

  pool.setInputTokenBalances([tvlCall.value.value2], true);
}

export function updatePoolOutputTokenSupply(pool: Pool): void {
  const contract = ERC20.bind(Address.fromString(constants.EZETH_ADDRESS));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}

export function getRestakeManagerAddress(depositQueue: Address): Address {
  const contract = DepositQueue.bind(depositQueue);

  const outputTokenSupply = readValue<Address>(
    contract.try_restakeManager(),
    Address.fromString(constants.ZERO_ADDRESS)
  );

  return outputTokenSupply;
}

export function updatePoolTvlAndSupplyL2(pool: Pool): void {
  // Update pool TVL for layer2 forks
  const poolContract = RestakeManager.bind(
    Address.fromBytes(pool.getBytesID())
  );

  const xezEthAddress = readValue<Address>(
    poolContract.try_xezETH(),
    Address.fromString(constants.ZERO_ADDRESS)
  );

  const xezEthContract = ERC20.bind(xezEthAddress);

  const tvl = readValue<BigInt>(
    xezEthContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([tvl], true);
  pool.setOutputTokenSupply(tvl);
}
