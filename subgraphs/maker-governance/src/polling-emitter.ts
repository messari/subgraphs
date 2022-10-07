import { Delegate, Delegation, Poll, PollVote } from "../generated/schema";
import { Voted } from "../generated/PollingEmitter/PollingEmitter";
import { getDelegate, getGovernanceFramework } from "./helpers";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, CHIEF } from "./constants";

export function handlePollVote(event: Voted): void {
  let voter = event.params.voter.toHexString();
  let pollId = event.params.pollId.toString();
  let optionId = event.params.optionId;

  let delegate = Delegate.load(voter);
  if (!delegate) {
    delegate = new Delegate(voter);
    delegate.isVoteDelegate = false;
    delegate.votingPowerRaw = BIGINT_ZERO;
    delegate.votingPower = BIGDECIMAL_ZERO;
    delegate.delegations = [];
    delegate.tokenHoldersRepresented = 0;
    delegate.currentSpells = [];
    delegate.numberVotes = 0;
    delegate.save();
  }

  let poll = Poll.load(pollId);
  if (!poll) {
    poll = new Poll(pollId);
    poll.save();
  }

  let voteId = voter.concat("-").concat(pollId);
  let pollVote = new PollVote(voteId);
  pollVote.choice = optionId;
  pollVote.voter = voter;
  pollVote.poll = pollId;
  pollVote.block = event.block.number;
  pollVote.blockTime = event.block.timestamp;
  pollVote.txnHash = event.transaction.hash.toHexString();
  pollVote.save();
}
