import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_FIVE = BigInt.fromI32(5);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const GOVERNANCE_NAME = "AaveGovernanceV2";
export const GOVERNANCE_ADDRESS = "0xEC568fffba86c094cf06b22134B23074DFE2252c";
export const GOVERNANCE_STRATEGY_ADDRESS =
  "0xb7e383ef9B1E9189Fc0F71fb30af8aa14377429e";
export const SHORT_EXECUTOR_ADDRESS =
  "0xee56e2b3d491590b5b31738cc34d5232f378a8d5";
export const TOKEN_ADDRESS = "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9";

export namespace DelegationType {
  export const VOTING_POWER = 0;
  export const PROPOSITION_POWER = 1;
}

export const YES_WINS = "Yes";
export const NO_WINS = "No";
export const ABSTAIN_WINS = "Abstain";
export const NA = "Na";

export const VOTING_CONSTANT = "Voting";
export const PROPOSITION_CONSTANT = "Proposition";
export const AAVE_CONSTANT = "Aave";
export const STKAAVE_CONSTANT = "StkAave";

export namespace ProposalState {
  export const PENDING = "PENDING";
  export const ACTIVE = "ACTIVE";
  export const CANCELED = "CANCELED";
  export const DEFEATED = "DEFEATED";
  export const SUCCEEDED = "SUCCEEDED";
  export const QUEUED = "QUEUED";
  export const EXPIRED = "EXPIRED";
  export const EXECUTED = "EXECUTED";
}

export namespace VoteChoice {
  export const AGAINST_VALUE = 0;
  export const FOR_VALUE = 1;
  export const AGAINST = "AGAINST";
  export const FOR = "FOR";
}
