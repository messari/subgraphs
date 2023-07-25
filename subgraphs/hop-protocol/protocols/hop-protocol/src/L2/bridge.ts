import { SDK } from "../../../../src/sdk/protocols/bridge";
import { TokenPricer } from "../../../../src/sdk/protocols/config";
import {
  TokenInitializer,
  TokenParams,
} from "../../../../src/sdk/protocols/bridge/tokens";
import {
  BridgePoolType,
  CrosschainTokenType,
} from "../../../../src/sdk/protocols/bridge/enums";
import { reverseChainIDs } from "../../../../src/sdk/protocols/bridge/chainIds";

import { NetworkConfigs } from "../../../../configurations/configure";
import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";
import {
  TransferSent,
  TransferFromL1Completed,
} from "../../../../generated/Bridge/Bridge";
import { Token } from "../../../../generated/schema";
import { getUsdPricePerToken, getUsdPrice } from "../../../../src/prices/index";
import { bigIntToBigDecimal } from "../../../../src/sdk/util/numbers";

import { FOUR, Network, THREE } from "../../../../src/sdk/util/constants";
import {
  updateL2OutgoingBridgeMessage,
  updateL2IncomingBridgeMessage,
} from "../../../../src/sdk/util/bridge";
import { conf } from "../../../../src/sdk/util/bridge";

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
    if (tokenConfig.length != FOUR) {
      log.error("Invalid tokenConfig length", []);
    }

    const name = tokenConfig[1];
    const symbol = tokenConfig[0];
    const decimals = BigInt.fromString(tokenConfig[2]).toI32();
    return { name, symbol, decimals };
  }
}

export function handleTransferFromL1Completed(
  event: TransferFromL1Completed
): void {
  log.info("TransferFromL1 - bridgeAddress: {},  hash: {}", [
    event.address.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
  if (!NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
    log.error("Missing Config", []);
    return;
  }
  const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
    event.address.toHexString()
  );
  if (inputToken.length != 2) {
    log.error("Invalid InputToken length", []);
    return;
  }
  const inputTokenOne = inputToken[0];
  const inputTokenTwo = inputToken[1];

  const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
    event.address.toHexString()
  );

  const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);
  if (poolConfig.length != THREE) {
    log.error("Invalid PoolConfig length", []);
    return;
  }

  log.info("S1 - inputToken: {},  poolAddress: {}", [
    inputTokenOne,
    poolAddress,
  ]);
  const poolName = poolConfig[0];
  const poolSymbol = poolConfig[1];
  const hPoolName = poolConfig[2];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const acc = sdk.Accounts.loadAccount(event.transaction.from);
  const tokenOne = sdk.Tokens.getOrCreateToken(
    Address.fromString(inputTokenOne)
  );
  const tokenTwo = sdk.Tokens.getOrCreateToken(
    Address.fromString(inputTokenTwo)
  );
  const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress));

  const hPool = sdk.Pools.loadPool<string>(
    Bytes.fromHexString(poolAddress.concat("-").concat("1"))
  );
  if (!pool.isInitialized) {
    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, tokenOne);
  }
  if (!hPool.isInitialized) {
    hPool.initialize(hPoolName, poolSymbol, BridgePoolType.LIQUIDITY, tokenTwo);
  }
  const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
    reverseChainIDs.get(Network.MAINNET)!,
    Address.fromString(
      NetworkConfigs.getMainnetCrossTokenFromTokenAddress(inputTokenOne)
    ),
    CrosschainTokenType.CANONICAL,
    Address.fromString(inputTokenOne)
  );

  pool.pool.relation = hPool.getBytesID();
  hPool.pool.relation = hPool.getBytesID();

  pool.addDestinationToken(crossToken);

  acc.transferIn(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.transaction.from,
    event.params.amount,
    event.transaction.hash
  );

  //MESSAGES
  const receipt = event.receipt;

  if (!receipt) return;
  updateL2IncomingBridgeMessage(event, event.params.recipient, acc, receipt);
}

export function handleTransferSent(event: TransferSent): void {
  log.info("TransferSent - bridgeAddress: {},  hash: {}, outgoingChainId: {}", [
    event.address.toHexString(),
    event.transaction.hash.toHexString(),
    event.params.chainId.toString(),
  ]);
  if (!NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
    log.error("Missing Config", []);
    return;
  }

  const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
    event.address.toHexString()
  );
  if (inputToken.length != 2) {
    log.error("Invalid InputToken length", []);
    return;
  }
  const inputTokenOne = inputToken[0];
  const inputTokenTwo = inputToken[1];

  const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
    event.address.toHexString()
  );

  const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);
  if (poolConfig.length != THREE) {
    log.error("Invalid PoolConfig length", []);
    return;
  }

  log.info("S1 - inputToken: {},  poolAddress: {}", [
    inputTokenOne,
    poolAddress,
  ]);
  const poolName = poolConfig[0];
  const poolSymbol = poolConfig[1];
  const hPoolName = poolConfig[2];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const tokenOne = sdk.Tokens.getOrCreateToken(
    Address.fromString(inputTokenOne)
  );
  const tokenTwo = sdk.Tokens.getOrCreateToken(
    Address.fromString(inputTokenTwo)
  );
  const acc = sdk.Accounts.loadAccount(event.params.recipient);
  const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress));

  const hPool = sdk.Pools.loadPool<string>(
    Bytes.fromHexString(poolAddress.concat("-").concat("1"))
  );
  if (!pool.isInitialized) {
    pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, tokenOne);
  }

  if (!hPool.isInitialized) {
    hPool.initialize(hPoolName, poolSymbol, BridgePoolType.LIQUIDITY, tokenTwo);
  }

  log.info("S2 - inputToken: {},  poolAddress: {}", [
    inputTokenOne,
    poolAddress,
  ]);

  pool.pool.relation = hPool.getBytesID();
  hPool.pool.relation = hPool.getBytesID();

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
  log.info("S3 - inputToken: {},  poolAddress: {}", [
    inputTokenOne,
    poolAddress,
  ]);
  pool.addDestinationToken(crossToken);
  acc.transferOut(
    pool,
    pool.getDestinationTokenRoute(crossToken)!,
    event.params.recipient,
    event.params.amount,
    event.transaction.hash
  );

  const receipt = event.receipt;

  if (!receipt) return;
  updateL2OutgoingBridgeMessage(
    event,
    event.params.recipient,
    event.params.chainId,
    acc,
    receipt
  );
}
