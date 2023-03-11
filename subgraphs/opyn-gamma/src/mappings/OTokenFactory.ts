import { OtokenCreated as OtokenCreatedEvent } from "../../generated/OTokenFactory/OTokenFactory";
import { OToken as OTokenTemplate } from "../../generated/templates";
import { createOption } from "../entities/option";

export function handleOtokenCreated(event: OtokenCreatedEvent): void {
  createOption(event);
  OTokenTemplate.create(event.params.tokenAddress);
}
