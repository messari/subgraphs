import { SDK } from "../../../../src/sdk/protocols/bridge";
import { TokenPricer } from "../../../../src/sdk/protocols/config";
import {
  TokenInitializer,
  TokenParams,
} from "../../../../src/sdk/protocols/bridge/tokens";
import {
  BridgePermissionType,
  BridgePoolType,
  CrosschainTokenType,
} from "../../../../src/sdk/protocols/bridge/enums";
import { BridgeConfig } from "../../../../src/sdk/protocols/bridge/config";
import { Versions } from "../../../../src/versions";
import { NetworkConfigs } from "../../../../configurations/configure";
import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import { Transfer } from "../../../../generated/Token/Token";
import { Token } from "../../../../generated/schema";
import { getUsdPricePerToken, getUsdPrice } from "../../../../src/prices/index";
import { bigIntToBigDecimal } from "../../../../src/sdk/util/numbers";
import { reverseChainIDs } from "../../../../src/sdk/protocols/bridge/chainIds";

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const tokenConfig = NetworkConfigs.getTokenDetails(address.toHexString());
    const symbol = tokenConfig[0];
    const name = tokenConfig[1];
    const decimals = BigInt.fromString(tokenConfig[2]).toI32();
    return { name, symbol, decimals };
  }
}

const conf = new BridgeConfig(
  "0x03d7f750777ec48d39d080b020d83eb2cb4e3547",
  "HOP-"
    .concat(dataSource.network().toUpperCase().replace("-", "_"))
    .concat("-BRIDGE"),
  "hop-".concat(dataSource.network().replace("-", "_")).concat("-bridge"),
  BridgePermissionType.PERMISSIONLESS,
  Versions
);

export function handleTransfer(event: Transfer): void {
  if (NetworkConfigs.getTokenList().includes(event.address.toHexString())) {
    if (
      !NetworkConfigs.getBridgeList().includes(event.params.from.toHexString())
    ) {
      return;
    }
    log.warning(
      "TransferIN 1 - TokenAddress: {}, fromAddress: {}, toAddress: {}",
      [
        event.address.toHexString(),
        event.params.from.toHexString(),
        event.params.to.toHexString(),
      ]
    );

    const tokenDetails = NetworkConfigs.getTokenDetails(
      event.address.toHexString()
    );

    log.warning(
      "TransferIN 2 - bridgeAddress: {}, TokenAddress: {}, fromAddress: {}, toAddress: {}",
      [
        tokenDetails[3],
        event.address.toHexString(),
        event.params.from.toHexString(),
        event.params.to.toHexString(),
      ]
    );
    const poolAddress = NetworkConfigs.getPoolAddressFromTokenAddress(
      event.address.toHexString()
    );
    log.warning("TransferIN 3 - poolAddress: {}", [poolAddress]);
    const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);

    log.warning("TransferIN 4 - poolDetails 1: {}, poolDetails 2: {}", [
      poolConfig[0],
      poolConfig[1],
    ]);
    const poolName = poolConfig[0];
    const poolSymbol = poolConfig[1];

    const sdk = SDK.initializeFromEvent(
      conf,
      new Pricer(),
      new TokenInit(),
      event
    );
    const token = sdk.Tokens.getOrCreateToken(event.address);
    const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress));

    if (!pool.isInitialized) {
      pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);
    }

    const acc = sdk.Accounts.loadAccount(event.params.to);
    const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
      reverseChainIDs.get(
        dataSource.network().toUpperCase().replace("-", "_")
      )!,
      event.address,
      CrosschainTokenType.CANONICAL,
      event.address
    );

    acc.transferIn(
      pool,
      pool.getDestinationTokenRoute(crossToken)!,
      event.transaction.from,
      event.params.value,
      event.transaction.hash
    );
    log.warning("TransferIN - TokenAddress: {},  txHash: {},", [
      event.address.toHexString(),
      event.transaction.hash.toHexString(),
    ]);
  }
}
