import * as constants from "../common/constants";
import { FewWrappedToken } from "../../generated/templates";
import { WrappedTokenCreated } from "../../generated/FewFactory/FewFactory";

export function handleWrappedTokenCreated(event: WrappedTokenCreated): void {
  const wrappedTokenAddress = event.params.wrappedToken;

  if (constants.BLACKLISTED_POOLS_LIST.includes(wrappedTokenAddress)) {
    // Skip pools with pricing outliers caused by low liquidity
    return;
  }

  FewWrappedToken.create(wrappedTokenAddress);
}
