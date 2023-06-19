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
import { reverseChainIDs } from "../../../../src/sdk/protocols/bridge/chainIds";
import { BridgeConfig } from "../../../../src/sdk/protocols/bridge/config";
import { Versions } from "../../../../src/versions";
import { NetworkConfigs } from "../../../../configurations/configure";
import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  TransferSent,
  TransferFromL1Completed,
} from "../../../../generated/HopL2Bridge/L2_Bridge";
import { Token } from "../../../../generated/schema";
import { getUsdPricePerToken, getUsdPrice } from "../../../../src/prices/index";
import { bigIntToBigDecimal } from "../../../../src/sdk/util/numbers";
import {
  XDAI_L2_SIGNATURE,
  OPTIMISM_L2_SIGNATURE,
  MESSENGER_EVENT_SIGNATURES,
} from "../../../../src/sdk/util/constants";
import {
  ARBITRUM_L1_SIGNATURE,
  Network,
  OPTIMISM_L1_SIGNATURE,
  TRANSFERTOL2,
  XDAI_L1_SIGNATURE,
} from "../../../../src/sdk/util/constants";

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

export function handleTransferFromL1Completed(
  event: TransferFromL1Completed
): void {
  log.warning("TransferFromL1 - bridgeAddress: {},  hash: {}", [
    event.address.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
  if (NetworkConfigs.getBridgeList().includes(event.address.toHexString())) {
    const inputTokenOne = NetworkConfigs.getTokenAddressFromBridgeAddress(
      event.address.toHexString()
    )[0];
    const inputTokenTwo = NetworkConfigs.getTokenAddressFromBridgeAddress(
      event.address.toHexString()
    )[1];

    log.warning("inputToken: {}, event.address: {}", [
      inputTokenOne,
      event.address.toHexString(),
    ]);
    const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
      event.address.toHexString()
    );
    log.warning(
      "inputTokenOne2: {}, event.address2: {}, poolAddress2: {}, txHash: {}",
      [
        inputTokenOne,
        event.address.toHexString(),
        poolAddress,
        event.transaction.hash.toHexString(),
      ]
    );
    const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);

    const poolName = poolConfig[1];
    const hPoolName = poolConfig[2];
    const poolSymbol = poolConfig[0];

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
      hPool.initialize(
        hPoolName,
        poolSymbol,
        BridgePoolType.LIQUIDITY,
        tokenTwo
      );
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

    if (receipt) {
      for (let index = 0; index < receipt.logs.length; index++) {
        const _topic0 = receipt.logs[index].topics[0].toHexString();
        if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue;

        const _optimismData = receipt.logs[index].topics[1];
        const _address = receipt.logs[index].address;
        const _data = receipt.logs[index].data;

        const data = Bytes.fromUint8Array(_data.subarray(0));

        log.warning(
          "MessageINDT - emittingContractaddress: {}, topic0: {}, logAddress: {}, data: {}",
          [
            event.address.toHexString(),
            _topic0,
            _address.toHexString(),
            data.toHexString(),
          ]
        );
        if (_topic0 == OPTIMISM_L2_SIGNATURE) {
          acc.messageIn(
            reverseChainIDs.get(Network.MAINNET)!,
            event.params.recipient,
            _optimismData
          );
        } else if (_topic0 == XDAI_L2_SIGNATURE) {
          acc.messageIn(
            reverseChainIDs.get(Network.MAINNET)!,
            event.params.recipient,
            data
          );
        }

        log.warning("MessageIN - TokenAddress: {}, data: {}", [
          event.address.toHexString(),
          data.toHexString(),
        ]);
      }
    }

    log.warning("TransferIN - TokenAddress: {},  txHash: {}", [
      event.address.toHexString(),
      event.transaction.hash.toHexString(),
    ]);
  }
}

export function handleTransferSent(event: TransferSent): void {
  const receipt = event.receipt;

  if (!receipt) return;
  for (let index = 0; index < receipt.logs.length; index++) {
    const _address = receipt.logs[index].address;
    if (receipt.logs[index].topics.length == 0) continue;

    const _topic0 = receipt.logs[index].topics[0].toHexString();

    if (_topic0 != TRANSFERTOL2) continue;

    const _chainID = receipt.logs.at(2).topic.at(1);
    const _recipient = receipt.logs.at(2).topic.at(3);

    const bridgeAddress = _topic0.address;
    const chainID = ethereum.decode("uint256", _chainID)!.toBigInt();
    const transferData = receipt.logs.at(2).data;

    const decoded = ethereum
      .decode("(uint256, uint256, uint256, uint256)", transferData)!
      .toTuple();

    const amount = decoded[0].toBigInt();

    const recipient = ethereum.decode("address", _recipient)!.toAddress();

    const _messengerdata = receipt.logs.at(1).data;
    const _messengerTopic0 = receipt.logs.at(1).topic.at(0);
    const messengerdata = Bytes.fromUint8Array(_messengerdata.subarray(0));

    log.warning(
      "TransferSent - bridgeAddress: {},  hash: {}, outgoingChainId: {}",
      [
        bridgeAddress.toHexString(),
        event.transaction.hash.toHexString(),
        chainID.toString(),
      ]
    );
    const inputTokenOne = NetworkConfigs.getTokenAddressFromBridgeAddress(
      bridgeAddress.toHexString()
    )[0];
    const inputTokenTwo = NetworkConfigs.getTokenAddressFromBridgeAddress(
      bridgeAddress.toHexString()
    )[1];

    const poolAddress = NetworkConfigs.getPoolAddressFromBridgeAddress(
      bridgeAddress.toHexString()
    );

    const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);
    log.warning("S1 - inputToken: {},  poolAddress: {}", [
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
    const acc = sdk.Accounts.loadAccount(recipient);
    const pool = sdk.Pools.loadPool<string>(Address.fromString(poolAddress));

    const hPool = sdk.Pools.loadPool<string>(
      Bytes.fromHexString(poolAddress.concat("-").concat("1"))
    );
    if (!pool.isInitialized) {
      pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, tokenOne);
    }

    if (!hPool.isInitialized) {
      hPool.initialize(
        hPoolName,
        poolSymbol,
        BridgePoolType.LIQUIDITY,
        tokenTwo
      );
    }

    log.warning("S2 - inputToken: {},  poolAddress: {}", [
      inputTokenOne,
      poolAddress,
    ]);

    pool.pool.relation = hPool.getBytesID();
    hPool.pool.relation = hPool.getBytesID();

    const crossToken = sdk.Tokens.getOrCreateCrosschainToken(
      chainID,
      Address.fromString(
        NetworkConfigs.getCrossTokenAddress(chainID.toString(), inputTokenOne)
      ),
      CrosschainTokenType.CANONICAL,
      Address.fromString(inputTokenOne)
    );
    log.warning("S3 - inputToken: {},  poolAddress: {}", [
      inputTokenOne,
      poolAddress,
    ]);
    pool.addDestinationToken(crossToken);
    acc.transferOut(
      pool,
      pool.getDestinationTokenRoute(crossToken)!,
      recipient,
      amount,
      event.transaction.hash
    );

    ///

    log.warning(
      "MessageOUTDT - emittingContractaddress: {}, topic0: {},  logAddress: {}, data: {}",
      [
        bridgeAddress.toHexString(),
        _topic0,
        _address.toHexString(),
        messengerdata.toHexString(),
      ]
    );
    if (_messengerTopic0 == ARBITRUM_L1_SIGNATURE) {
      acc.messageOut(chainID, recipient, messengerdata);
    } else if (_messengerTopic0 == XDAI_L1_SIGNATURE) {
      const _xDaiData = receipt.logs.at(1).topic.at(3);
      const xDaiData = ethereum.decode("bytes32", _xDaiData)!.toBytes();

      acc.messageOut(chainID, event.params.recipient, xDaiData);
    } else if (_messengerTopic0 == OPTIMISM_L1_SIGNATURE) {
      const _optimismData = receipt.logs.at(1).topic.at(1);
      const optimismData = ethereum.decode("bytes32", _optimismData)!.toBytes();

      acc.messageOut(chainID, recipient, optimismData);

      log.warning("MessageOUT - BridgeAddress: {}, data: {}", [
        event.address.toHexString(),
        messengerdata.toHexString(),
      ]);
    }

    log.warning("MessageOUTDT2 - TokenAddress: {},  data: {}", [
      bridgeAddress.toHexString(),
      messengerdata.toHexString(),
    ]);
  }
  log.warning("TransferOUT - txHash: {},", [
    event.transaction.hash.toHexString(),
  ]);
}
