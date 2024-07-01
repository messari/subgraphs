import * as constants from "../common/constants";
import { FewWrappedToken } from "../../generated/templates";
import { WrappedTokenCreated } from "../../generated/FewFactory/FewFactory";

export function handleWrappedTokenCreated(event: WrappedTokenCreated): void {
  const wrappedTokenAddress = event.params.wrappedToken;

  FewWrappedToken.create(wrappedTokenAddress);
}
