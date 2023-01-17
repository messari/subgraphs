import {
  RelayedMessage as RelayedMessageEvent,
  SentMessage as SentMessageEvent,
} from "../../generated/templates/Bridge/L1CrossDomainMessenger";
import { getSDK } from "../sdk";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";
import { Network } from "../sdk/util/constants";

export function handleRelayedMessage(event: RelayedMessageEvent): void {}

export function handleSentMessage(event: SentMessageEvent): void {
  const sdk = getSDK(event);
  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.sendMessage(
    event.params.target,
    networkToChainID(Network.OPTIMISM),
    event.params.message
  );
}
