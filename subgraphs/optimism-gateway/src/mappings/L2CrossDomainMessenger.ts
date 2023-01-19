import { SentMessage as SentMessageEvent } from "../../generated/templates/Bridge/L2CrossDomainMessenger";
import { getSDK } from "../sdk";
import { networkToChainID } from "../sdk/protocols/bridge/chainIds";
import { Network } from "../sdk/util/constants";

export function handleSentMessage(event: SentMessageEvent): void {
  const sdk = getSDK(event);
  const account = sdk.Accounts.loadAccount(event.transaction.from);
  account.messageOut(
    networkToChainID(Network.MAINNET),
    event.params.target,
    event.params.message
  );
}
