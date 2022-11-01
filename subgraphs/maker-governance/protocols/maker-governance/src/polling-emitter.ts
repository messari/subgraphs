import { Poll, PollVote } from "../../../generated/schema";
import { Voted } from "../../../generated/PollingEmitter/PollingEmitter";
import { getDelegate } from "../../../src/helpers";

export function handlePollVote(event: Voted): void {
  const voter = event.params.voter.toHexString();
  const pollId = event.params.pollId.toString();
  const optionId = event.params.optionId;

  const delegate = getDelegate(voter);
  delegate.numberPoleVotes = delegate.numberPoleVotes + 1;
  delegate.save();

  let poll = Poll.load(pollId);
  if (!poll) {
    poll = new Poll(pollId);
    poll.save();
  }

  const voteId = voter.concat("-").concat(pollId);
  const pollVote = new PollVote(voteId);
  pollVote.choice = optionId;
  pollVote.voter = voter;
  pollVote.poll = pollId;
  pollVote.block = event.block.number;
  pollVote.blockTime = event.block.timestamp;
  pollVote.txnHash = event.transaction.hash.toHexString();
  pollVote.save();
}
