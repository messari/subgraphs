import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Token } from "../../generated/schema";
import { LockedERC20 } from "../../generated/FxERC20Events/ERC20Predicate";
import { NetworkConfigs } from "../../configurations/configure";

import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BridgeConfig } from "../sdk/protocols/bridge/config";
import { SDK } from "../sdk/protocols/bridge";
import { TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/bridge/tokens";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../sdk/protocols/bridge/enums";
import { getUsdPricePerToken, getUsdPrice } from "../prices";
import { Versions } from "../versions";
import { ERC20 } from "../../generated/FxERC20Events/ERC20";
import { RootChainManager } from "../../generated/FxERC20Events/RootChainManager";
import { BIGDECIMAL_ZERO } from "../prices/common/constants";
import { conf, Pricer, TokenInit } from "./fx-erc20";

export function handleERC20Lock(event: LockedERC20): void {
  // poolAddress == RootToken Address
  const poolAddr = event.params.rootToken;
  const amount = event.params.amount;
  const crosschainID = BigInt.fromI32(137);

  const sdk = SDK.initialize(conf, new Pricer(), new TokenInit(), event);

  const pool = sdk.Pools.loadPool<string>(event.params.rootToken);
  const token = sdk.Tokens.getOrCreateToken(event.params.rootToken);

  if (!pool.isInitialized) {
    pool.initialize(
      token.name,
      token.symbol,
      BridgePoolType.LOCK_RELEASE,
      token
    );
  }

  const rootChainManger = RootChainManager.bind(
    Address.fromString(conf.getID())
  );
  const crosschainTokenAddr_call = rootChainManger.try_rootToChildToken(
    event.params.rootToken
  );

  if (crosschainTokenAddr_call.reverted) {
    log.warning(
      "[handleSwapIn] No crosschainToken for network: {} poolID: {} token: {}",
      [
        crosschainID.toString(),
        poolAddr.toHexString(),
        event.params.rootToken.toHexString(),
      ]
    );

    return;
  }

  const crosschainTokenAddr = crosschainTokenAddr_call.value;

  const crosschainToken = sdk.Tokens.getOrCreateCrosschainToken(
    crosschainID,
    crosschainTokenAddr,
    CrosschainTokenType.WRAPPED,
    Address.fromBytes(token.id)
  );

  pool.addDestinationToken(crosschainToken);
  const route = pool.getDestinationTokenRoute(crosschainToken);

  const account = sdk.Accounts.loadAccount(event.params.depositor);
  account.transferOut(pool, route!, event.params.depositReceiver, amount);
}
