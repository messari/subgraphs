import {
  RelayedMessage as RelayedMessageEvent,
  SentMessage as SentMessageEvent,
} from "../../generated/templates/Bridge/L1CrossDomainMessenger";

export function handleRelayedMessage(event: RelayedMessageEvent): void {}

export function handleSentMessage(event: SentMessageEvent): void {}
