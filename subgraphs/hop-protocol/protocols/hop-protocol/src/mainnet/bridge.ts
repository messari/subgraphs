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
import { updateL1OutgoingBridgeMessage } from "../../../../src/sdk/util/bridge";

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
  if (!NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
    log.error("Missing Config", []);
    return;
  }
  const inputTokenOne = NetworkConfigs.getTokenAddressFromBridgeAddress(
    event.address.toHexString()
  )[0];

  log.warning("inputToken1: {}, bridgeAddress: {}, chainId: {}", [
    inputTokenOne,
    event.address.toHexString(),
    event.params.chainId.toHexString(),
  ]);

  const poolAddress = NetworkConfigs.getPoolAddressFromChainId(
    event.params.chainId.toString(),
    event.address.toHexString()
  );
  log.warning("poolAddress2: {}, inputToken: {}, chainId: {}", [
    poolAddress,
    inputTokenOne,
    event.params.chainId.toString(),
  ]);

  const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);

  log.warning("poolAddress3: {}, inputTokenOne: {}", [
    poolAddress,
    inputTokenOne,
  ]);

  const poolName = poolConfig[0];
  const poolSymbol = poolConfig[1];

  log.warning("poolAddress4: {}, inputTokenOne: {}", [
    poolAddress,
    inputTokenOne,
  ]);

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  log.warning("Receipient1: {}, inputTokenOne: {}", [
    event.params.recipient.toHexString(),
    inputTokenOne,
  ]);
  const acc = sdk.Accounts.loadAccount(event.params.recipient);

  log.warning("Receipient2: {}, poolAddress: {}", [
    event.params.recipient.toHexString(),
    poolAddress,
  ]);

  const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress));

  log.warning("Receipient3: {}, inputTokenOne: {}", [
    event.params.recipient.toHexString(),
    inputTokenOne,
  ]);

  const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenOne));
  log.warning("Receipient4: {}, inputTokenOne: {}", [
    event.params.recipient.toHexString(),
    inputTokenOne,
  ]);

  if (!pool.isInitialized) {
    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);
  }
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    event.params.chainId,
    Address.fromString(
      NetworkConfigs.getCrossTokenAddress(
        event.params.chainId.toString(),
        inputTokenOne
      )
    ),
    CrosschainTokenType.CANONICAL,
    Address.fromString(inputTokenOne)
  );
  log.warning("S5 - chainID: {}, inputTokenOne: {}", [
    event.params.chainId.toHexString(),
    inputTokenOne,
  ]);
  pool.addDestinationToken(crossToken);

  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.recipient,
    event.params.amount
  );
  log.warning("S6 - chainID: {}, inputTokenOne: {}", [
    event.params.chainId.toString(),
    inputTokenOne,
  ]);

  pool.addInputTokenBalance(event.params.amount);

  const receipt = event.receipt;
  if (!receipt) return;

  log.warning("S7 - chainID: {}, inputTokenOne: {}, txHash: {}", [
    event.params.chainId.toString(),
    inputTokenOne,
    event.transaction.hash.toHexString(),
  ]);

  updateL1OutgoingBridgeMessage(
    event,
    event.params.recipient,
    event.params.chainId,
    acc,
    inputTokenOne,
    receipt
  );

  log.warning("TransferOUT - BridgeAddress: {},  txHash: {}", [
    event.address.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}
