import { SDK } from "../../../../src/sdk/protocols/bridge";
import { TokenPricer } from "../../../../src/sdk/protocols/config";
import {
  TokenInitializer,
  TokenParams,
} from "../../../../src/sdk/protocols/bridge/tokens";
import {
  CrosschainTokenType,
  BridgePoolType,
} from "../../../../src/sdk/protocols/bridge/enums";

import { NetworkConfigs } from "../../../../configurations/configure";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { TransferSentToL2 } from "../../../../generated/Bridge/Bridge";
import { conf } from "../../../../src/sdk/util/bridge";

import { Token } from "../../../../generated/schema";
import { getUsdPricePerToken, getUsdPrice } from "../../../../src/prices/index";
import { bigIntToBigDecimal } from "../../../../src/sdk/util/numbers";
import { updateL1OutgoingBridgeMessage } from "../../../../src/sdk/util/bridge";
import { FOUR } from "../../../../src/sdk/util/constants";

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

export function handleTransferSentToL2(event: TransferSentToL2): void {
  if (!NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
    log.error("Missing Config", []);
    return;
  }

  const inputToken = NetworkConfigs.getTokenAddressFromBridgeAddress(
    event.address.toHexString()
  );
  if (inputToken.length != 1) {
    log.error("Invalid InputToken length", []);
    return;
  }
  const inputTokenOne = inputToken[0];

  log.info("inputToken1: {}, bridgeAddress: {}, chainId: {}", [
    inputTokenOne,
    event.address.toHexString(),
    event.params.chainId.toHexString(),
  ]);

  const poolAddress = NetworkConfigs.getPoolAddressFromChainId(
    event.params.chainId.toString(),
    event.address.toHexString()
  );

  const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);
  if (poolConfig.length != 2) {
    log.error("Invalid PoolConfig length", []);
    return;
  }

  const poolName = poolConfig[0];
  const poolSymbol = poolConfig[1];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const acc = sdk.Accounts.loadAccount(event.params.recipient);

  const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress));
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(inputTokenOne));

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
  log.info("S5 - chainID: {}, inputTokenOne: {}", [
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
  log.info("S6 - chainID: {}, inputTokenOne: {}", [
    event.params.chainId.toString(),
    inputTokenOne,
  ]);

  pool.addInputTokenBalance(event.params.amount);

  const receipt = event.receipt;
  if (!receipt) return;

  log.info("S7 - chainID: {}, inputTokenOne: {}, txHash: {}", [
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

  log.info("TransferOUT - BridgeAddress: {},  txHash: {}", [
    event.address.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}
