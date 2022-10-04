import { BigInt, Bytes, Address, ethereum, log } from "@graphprotocol/graph-ts";
import { LogNote, Etch } from "../generated/DSChief/DSChief";
import { VoteDelegate } from "../generated/DSChief/VoteDelegate";
import { Slate, Spell, Vote, Delegate } from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  SpellState,
} from "./constants";
import {
  addWeightToSpells,
  createSlate,
  getDelegate,
  getGovernanceFramework,
  hexToNumberString,
  removeWeightFromSpells,
  toDecimal,
} from "./helpers";
import { VoteDelegate as VoteDelegateTemplate } from "../generated/templates";

export function handleLock(event: LogNote): void {
  let sender = event.params.guy; // guy is the sender
  let amountStr = hexToNumberString(event.params.foo.toHexString());
  let amount = BigInt.fromString(amountStr); //.foo is the amount being locked

  let newDelegateCount = 0;
  let delegate = Delegate.load(sender.toHexString());
  if (!delegate) {
    delegate = new Delegate(sender.toHexString());
    delegate.isVoteDelegate = false;
    delegate.votingPowerRaw = BIGINT_ZERO;
    delegate.votingPower = BIGDECIMAL_ZERO;
    delegate.delegations = [];
    delegate.tokenHoldersRepresented = 0;
    delegate.currentSpells = [];
    delegate.numberVotes = 0;

    // Check if vote delegate contract by calling chief()
    let voteDelegate = VoteDelegate.bind(sender);
    let res = voteDelegate.try_chief();
    // will revert if not a contract
    if (!res.reverted) {
      delegate.isVoteDelegate = true;
      // Track this new vote delegate contract
      VoteDelegateTemplate.create(sender);

      newDelegateCount = 1;
    }
  }

  delegate.votingPowerRaw = delegate.votingPowerRaw.plus(amount);
  delegate.votingPower = delegate.votingPower.plus(toDecimal(amount));
  addWeightToSpells(delegate.currentSpells, amount);
  delegate.save();

  let framework = getGovernanceFramework(event.address.toHexString());
  framework.currentTokenLockedInChief =
    framework.currentTokenLockedInChief.plus(amount);
  framework.totalDelegates = framework.totalDelegates + newDelegateCount;
  framework.save();
}

export function handleFree(event: LogNote): void {
  let sender = event.params.guy; // guy is the sender
  let amountStr = hexToNumberString(event.params.foo.toHexString());
  let amount = BigInt.fromString(amountStr); //.foo is the amount being locked

  let delegate = getDelegate(sender.toHexString());
  delegate.votingPowerRaw = delegate.votingPowerRaw.minus(amount);
  delegate.votingPower = delegate.votingPower.minus(toDecimal(amount));
  removeWeightFromSpells(delegate.currentSpells, amount);
  delegate.save();

  let framework = getGovernanceFramework(event.address.toHexString());
  framework.currentTokenLockedInChief =
    framework.currentTokenLockedInChief.minus(amount);
  framework.save();
}

export function handleVote(event: LogNote): void {
  let sender = event.params.guy.toHexString(); // guy is the sender
  let slateID = event.params.foo; // foo is slate id
  _handleSlateVote(sender, slateID, event);
}

export function handleEtch(event: Etch): void {
  let sender = event.transaction.from.toHexString();
  // Check if txn is coming from a vote delegate contract, if so treat it as sender
  if (event.transaction.to && event.transaction.to != event.address) {
    sender = event.transaction.to!.toHexString();
  }
  let slateID = event.params.slate;
  _handleSlateVote(sender, slateID, event);
}

function _handleSlateVote(
  sender: string,
  slateID: Bytes,
  event: ethereum.Event
): void {
  let delegate = getDelegate(sender);
  let slate = Slate.load(slateID.toHexString());
  if (!slate) {
    slate = createSlate(slateID, event);
  }

  // Remove votes from previous spells
  removeWeightFromSpells(delegate.currentSpells, delegate.votingPowerRaw);

  for (let i = 0; i < slate.yays.length; i++) {
    let spellID = slate.yays[i];
    let spell = Spell.load(spellID);
    if (spell) {
      let voteId = sender.concat("-").concat(spellID);
      let vote = new Vote(voteId);
      vote.weight = delegate.votingPowerRaw;
      vote.reason = "";
      vote.voter = sender;
      vote.spell = spellID;
      vote.block = event.block.number;
      vote.blockTime = event.block.timestamp;
      vote.txnHash = event.transaction.hash.toHexString();
      vote.save();

      spell.totalVotes = spell.totalVotes.plus(BIGINT_ONE);
      spell.totalWeightedVotes = spell.totalWeightedVotes.plus(
        delegate.votingPowerRaw
      );
      spell.save();
    }
  }

  delegate.currentSpells = slate.yays;
  delegate.numberVotes = delegate.numberVotes + 1;
  delegate.save();
}

export function handleLift(event: LogNote): void {
  // foo is the spellID in bytes, we trim and convert to address
  let spellID = Address.fromString(event.params.foo.toHexString().slice(26));

  let spell = Spell.load(spellID.toHexString());
  if (!spell) return;
  spell.state = SpellState.LIFTED;
  spell.liftedTxnHash = event.transaction.hash.toHexString();
  spell.liftedTime = event.block.timestamp;
  spell.liftedWith = spell.totalWeightedVotes;
  spell.save();

  // Update governance framework everytime a spell is lifted
  let framework = getGovernanceFramework(event.address.toHexString());
  framework.currentHat = spell.id;
  framework.save();
}
