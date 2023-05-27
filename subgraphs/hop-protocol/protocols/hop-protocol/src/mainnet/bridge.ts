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
  Bytes,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import {
  TransferSentToL2,
  BonderAdded,
} from "../../../../generated/HopL1Bridge/L1_Bridge";

import { Token } from "../../../../generated/schema";
import { getUsdPricePerToken, getUsdPrice } from "../../../../src/prices/index";
import { bigIntToBigDecimal } from "../../../../src/sdk/util/numbers";
import {
  ARBITRUM_L1_SIGNATURE,
  MESSENGER_EVENT_SIGNATURES,
  OPTIMISM_L1_SIGNATURE,
  XDAI_L1_SIGNATURE,
} from "../../../../src/common/constants";

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
  "0x03D7f750777eC48d39D080b020D83Eb2CB4e3547",
  "HOP-"
    .concat(dataSource.network().toUpperCase().replace("-", "_"))
    .concat("-BRIDGE"),
  "hop-".concat(dataSource.network().replace("-", "_")).concat("-bridge"),
  BridgePermissionType.PERMISSIONLESS,
  Versions
);

export function handleBonderAdded(event: BonderAdded): void {
  if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
    log.warning("bridgeAddress: {}", [event.address.toHexString()]);

    const sdk = SDK.initializeFromEvent(
      conf,
      new Pricer(),
      new TokenInit(),
      event
    );
    sdk.Accounts.loadAccount(event.params.newBonder);
  }
}

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

    let receipt = event.receipt;

    if (receipt) {
      log.warning("S7 - chainID: {}, inputToken: {}, txHash: {}", [
        event.params.chainId.toString(),
        inputToken,
        event.transaction.hash.toHexString(),
      ]);
      for (let index = 0; index < receipt.logs.length; index++) {
        const _address = receipt.logs[index].address;
        if (receipt.logs[index].topics.length == 0) continue;

        const _topic0 = receipt.logs[index].topics[0].toHexString();
        const _data = receipt.logs[index].data;

        log.warning("S8 - chainID: {}, topic0: {}, txHash: {}", [
          event.params.chainId.toString(),
          _topic0,
          event.transaction.hash.toHexString(),
        ]);
        if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue;
        log.warning(
          "S9 - chainID: {}, inputToken: {}, topic0: {}, txHash: {}",
          [
            event.params.chainId.toString(),
            inputToken,
            _topic0,
            event.transaction.hash.toHexString(),
          ]
        );

        const data = Bytes.fromUint8Array(_data.subarray(0));

        log.warning(
          "MessageOUTDT - emittingContractaddress: {}, topic0: {}, logAddress: {}, data: {}",
          [
            event.address.toHexString(),
            _topic0,
            _address.toHexString(),
            data.toHexString(),
          ]
        );
        if (_topic0 == ARBITRUM_L1_SIGNATURE) {
          acc.messageOut(event.params.chainId, event.params.recipient, data);
        } else if (_topic0 == XDAI_L1_SIGNATURE) {
          const _xDaiData = receipt.logs[index].topics[3];

          acc.messageOut(
            event.params.chainId,
            event.params.recipient,
            _xDaiData
          );
        } else if (_topic0 == OPTIMISM_L1_SIGNATURE) {
          const _optimismData = receipt.logs[index].topics[1];

          acc.messageOut(
            event.params.chainId,
            event.params.recipient,
            _optimismData
          );

          log.warning("MessageOUT - BridgeAddress: {}, data: {}", [
            event.address.toHexString(),
            data.toHexString(),
          ]);
        }
      }
    }

    log.warning("TransferOUT - BridgeAddress: {},  txHash: {}", [
      event.address.toHexString(),
      event.transaction.hash.toHexString(),
    ]);
  }
}
