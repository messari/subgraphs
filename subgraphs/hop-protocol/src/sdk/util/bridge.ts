import {
  Address,
  BigInt,
  Bytes,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  ARBITRUM_L1_SIGNATURE,
  MESSENGER_EVENT_SIGNATURES,
  Network,
  OPTIMISM_L1_SIGNATURE,
  OPTIMISM_L2_SIGNATURE,
  XDAI_L1_SIGNATURE,
  XDAI_L2_SIGNATURE,
} from "./constants";
import { Account } from "../protocols/bridge/account";
import { reverseChainIDs } from "../protocols/bridge/chainIds";
import { BridgeConfig } from "../../../src/sdk/protocols/bridge/config";
import { Versions } from "../../../src/versions";

import { BridgePermissionType } from "../../../src/sdk/protocols/bridge/enums";

export const conf = new BridgeConfig(
  "0x03d7f750777ec48d39d080b020d83eb2cb4e3547",
  "HOP-"
    .concat(dataSource.network().toUpperCase().replace("-", "_"))
    .concat("-BRIDGE"),
  "hop-".concat(dataSource.network().replace("-", "_")).concat("-bridge"),
  BridgePermissionType.PERMISSIONLESS,
  Versions
);

export function updateL1OutgoingBridgeMessage(
  event: ethereum.Event,
  recipient: Address,
  chainId: BigInt,
  acc: Account,
  inputToken: string,
  receipt: ethereum.TransactionReceipt
): void {
  for (let index = 0; index < receipt.logs.length; index++) {
    const _address = receipt.logs[index].address;
    if (receipt.logs[index].topics.length == 0) continue;

    const _topic0 = receipt.logs[index].topics[0].toHexString();
    const _data = receipt.logs[index].data;

    log.info("S8 - chainID: {}, topic0: {}, txHash: {}", [
      chainId.toString(),
      _topic0,
      event.transaction.hash.toHexString(),
    ]);
    if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue;
    log.info("S9 - chainID: {}, inputToken: {}, topic0: {}, txHash: {}", [
      chainId.toString(),
      inputToken,
      _topic0,
      event.transaction.hash.toHexString(),
    ]);

    const data = Bytes.fromUint8Array(_data.subarray(0));

    log.info(
      "MessageOUTDT - emittingContractaddress: {}, topic0: {}, logAddress: {}, data: {}",
      [
        event.address.toHexString(),
        _topic0,
        _address.toHexString(),
        data.toHexString(),
      ]
    );
    if (_topic0 == ARBITRUM_L1_SIGNATURE) {
      acc.messageOut(chainId, recipient, data);
    } else if (_topic0 == XDAI_L1_SIGNATURE) {
      const _xDaiData = receipt.logs[index].topics[3];

      acc.messageOut(chainId, recipient, _xDaiData);
    } else if (_topic0 == OPTIMISM_L1_SIGNATURE) {
      const _optimismData = receipt.logs[index].topics[1];

      acc.messageOut(chainId, recipient, _optimismData);

      log.info("MessageOUT - BridgeAddress: {}, data: {}", [
        event.address.toHexString(),
        data.toHexString(),
      ]);
    }
  }
}

export function updateL2OutgoingBridgeMessage(
  event: ethereum.Event,
  recipient: Address,
  chainId: BigInt,
  acc: Account,
  receipt: ethereum.TransactionReceipt
): void {
  for (let index = 0; index < receipt.logs.length; index++) {
    const _address = receipt.logs[index].address;
    if (receipt.logs[index].topics.length == 0) continue;

    const _topic0 = receipt.logs[index].topics[0].toHexString();
    if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue;
    const _data = receipt.logs[index].data;

    const data = Bytes.fromUint8Array(_data.subarray(0));

    log.info(
      "MessageOUTDT - emittingContractaddress: {}, topic0: {},  logAddress: {}, data: {}",
      [
        event.address.toHexString(),
        _topic0,
        _address.toHexString(),
        data.toHexString(),
      ]
    );
    if (_topic0 == XDAI_L2_SIGNATURE || _topic0 == OPTIMISM_L2_SIGNATURE) {
      acc.messageOut(chainId, recipient, data);
    }
    log.info("MessageOUTDT2 - TokenAddress: {},  data: {}", [
      event.address.toHexString(),
      data.toHexString(),
    ]);
  }

  log.info("TransferOUT - TokenAddress: {},  txHash: {},", [
    event.address.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function updateL2IncomingBridgeMessage(
  event: ethereum.Event,
  recipient: Address,
  acc: Account,
  receipt: ethereum.TransactionReceipt
): void {
  for (let index = 0; index < receipt.logs.length; index++) {
    const _topic0 = receipt.logs[index].topics[0].toHexString();
    if (!MESSENGER_EVENT_SIGNATURES.includes(_topic0)) continue;

    const _optimismData = receipt.logs[index].topics[1];
    const _address = receipt.logs[index].address;
    const _data = receipt.logs[index].data;

    const data = Bytes.fromUint8Array(_data.subarray(0));

    log.info(
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
        recipient,
        _optimismData
      );
    } else if (_topic0 == XDAI_L2_SIGNATURE) {
      acc.messageIn(reverseChainIDs.get(Network.MAINNET)!, recipient, data);
    }

    log.info("MessageIN - TokenAddress: {}, data: {}", [
      event.address.toHexString(),
      data.toHexString(),
    ]);
  }

  log.info("TransferIN - TokenAddress: {},  txHash: {}", [
    event.address.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}
