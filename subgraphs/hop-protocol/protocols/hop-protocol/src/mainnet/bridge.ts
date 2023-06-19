import { SDK } from "../../../../src/sdk/protocols/bridge";
import { TokenPricer } from "../../../../src/sdk/protocols/config";
import {
  TokenInitializer,
  TokenParams,
} from "../../../../src/sdk/protocols/bridge/tokens";
import {
  BridgePermissionType,
  CrosschainTokenType,
  BridgePoolType,
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
import { TransferSentToL2 } from "../../../../generated/Bridge/Bridge";

import { Token } from "../../../../generated/schema";
import { getUsdPricePerToken, getUsdPrice } from "../../../../src/prices/index";
import { bigIntToBigDecimal } from "../../../../src/sdk/util/numbers";
import { updateBridgeMessage } from "../../../../src/sdk/util/bridge";

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
    const tokenConfig = NetworkConfigs.getTokenDetails(address.toHex());
    const name = tokenConfig[1];
    const symbol = tokenConfig[0];
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

export function handleTransferSentToL2(event: TransferSentToL2): void {
  if (event.params.chainId.toString() == "42170") return;

  if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
    const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
      event.address.toHexString()
    )[0];

    log.warning("inputToken1: {}, bridgeAddress: {}, chainId: {}", [
      inputToken,
      event.address.toHexString(),
      event.params.chainId.toHexString(),
    ]);

    const poolAddress = NetworkConfigs.getPoolAddressFromChainId(
      event.params.chainId.toString(),
      event.address.toHexString()
    );
    log.warning("poolAddress2: {}, inputToken: {}, chainId: {}", [
      poolAddress,
      inputToken,
      event.params.chainId.toString(),
    ]);

    const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);

    log.warning("poolAddress3: {}, inputToken: {}", [poolAddress, inputToken]);

    const poolName = poolConfig[0];
    const poolSymbol = poolConfig[1];

    log.warning("poolAddress4: {}, inputToken: {}", [poolAddress, inputToken]);

    const sdk = SDK.initializeFromEvent(
      conf,
      new Pricer(),
      new TokenInit(),
      event
    );

    log.warning("Receipient1: {}, inputToken: {}", [
      event.params.recipient.toHexString(),
      inputToken,
    ]);
    const acc = sdk.Accounts.loadAccount(event.params.recipient);

    log.warning("Receipient2: {}, poolAddress: {}", [
      event.params.recipient.toHexString(),
      poolAddress,
    ]);

    const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress));

    log.warning("Receipient3: {}, inputToken: {}", [
      event.params.recipient.toHexString(),
      inputToken,
    ]);

    const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputToken));
    log.warning("Receipient4: {}, inputToken: {}", [
      event.params.recipient.toHexString(),
      inputToken,
    ]);

    if (!pool.isInitialized) {
      pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);
    }
    const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
      event.params.chainId,
      Address.fromString(
        NetworkConfigs.getCrossTokenAddress(
          event.params.chainId.toString(),
          inputToken
        )
      ),
      CrosschainTokenType.CANONICAL,
      Address.fromString(inputToken)
    );
    log.warning("S5 - chainID: {}, inputToken: {}", [
      event.params.chainId.toHexString(),
      inputToken,
    ]);
    pool.addDestinationToken(crossToken);

    acc.transferOut(
      pool,
      pool.getDestinationTokenRoute(crossToken)!,
      event.params.recipient,
      event.params.amount
    );
    log.warning("S6 - chainID: {}, inputToken: {}", [
      event.params.chainId.toString(),
      inputToken,
    ]);

    pool.addInputTokenBalance(event.params.amount);

    const receipt = event.receipt;
    if (!receipt) return;

    log.warning("S7 - chainID: {}, inputToken: {}, txHash: {}", [
      event.params.chainId.toString(),
      inputToken,
      event.transaction.hash.toHexString(),
    ]);

    updateBridgeMessage(
      event,
      event.params.recipient,
      event.params.chainId,
      acc,
      inputToken,
      receipt
    );

    log.warning("TransferOUT - BridgeAddress: {},  txHash: {}", [
      event.address.toHexString(),
      event.transaction.hash.toHexString(),
    ]);
  }
}
