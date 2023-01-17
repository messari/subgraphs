import {
  RelayedMessage as RelayedMessageEvent,
  SentMessage as SentMessageEvent,
} from "../../generated/templates/Bridge/L2CrossDomainMessenger";

export function handleRelayedMessage(event: RelayedMessageEvent): void {}

export function handleSentMessage(event: SentMessageEvent): void {}
