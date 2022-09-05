import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_FIVE = BigInt.fromI32(5);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);

export const GOVERNANCE_TYPE = "AaveGovernanceV2";

export namespace DelegationType {
  export const VOTING_POWER = 0;
  export const PROPOSITION_POWER = 1;
}

export const YES_WINS = "Yes";
export const NO_WINS = "No";
export const ABSTAIN_WINS = "Abstain";
export const NA = "N/A";

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
