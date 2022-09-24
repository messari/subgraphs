import { BigInt, Bytes, Address, ethereum, log } from "@graphprotocol/graph-ts";
import { LogNote, DSChief, Etch } from "../generated/DSChief/DSChief";
import { DSSpell } from "../generated/DSChief/DSSpell";
import { VoteDelegate } from "../generated/DSChief/VoteDelegate";
import { Slate, Spell, Vote, Delegate } from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  SpellState,
} from "./constants";
import { getDelegate, hexToNumberString, toDecimal } from "./helpers";
import {
  // DSSpell as DSSpellTemplate,
  VoteDelegate as VoteDelegateTemplate,
} from "../generated/templates";

export function handleLock(event: LogNote): void {
  let sender = event.params.guy; // guy is the sender
  let amountStr = hexToNumberString(event.params.foo.toHexString());
  let amount = BigInt.fromString(amountStr); //.foo is the amount being locked

  let delegate = Delegate.load(sender.toHexString());
  if (!delegate) {
    delegate = new Delegate(sender.toHexString());
    delegate.votingPowerRaw = BIGINT_ZERO;
    delegate.votingPower = BIGDECIMAL_ZERO;
    delegate.tokenHoldersRepresented = 0;
    delegate.numberVotes = 0;

    // Check if vote delegate contract by calling chief()
    let voteDelegate = VoteDelegate.bind(sender);
    let res = voteDelegate.try_chief();
    // will revert if not a contract
    if (!res.reverted) {
      delegate.isVoteDelegate = true;
      // Track this new vote delegate contract
      VoteDelegateTemplate.create(sender);
    }
  }

  delegate.votingPowerRaw = delegate.votingPowerRaw.plus(amount);
  delegate.votingPower = delegate.votingPower.plus(toDecimal(amount));
  delegate.save();
}

export function handleFree(event: LogNote): void {
  let sender = event.params.guy; // guy is the sender
  let amountStr = hexToNumberString(event.params.foo.toHexString());
  let amount = BigInt.fromString(amountStr); //.foo is the amount being locked

  let delegate = getDelegate(sender.toHexString());
  delegate.votingPowerRaw = delegate.votingPowerRaw.minus(amount);
  delegate.votingPower = delegate.votingPower.minus(toDecimal(amount));
  delegate.save();
}

export function handleVote(event: LogNote): void {
  let sender = event.params.guy.toHexString(); // guy is the sender
  let slateID = event.params.foo; // foo is slate id
  _handleSlateVote(sender, slateID, event);
}

export function handleEtch(event: Etch): void {
  let sender = event.transaction.from.toHexString();
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
    slate = new Slate(slateID.toHexString());
    slate.yays = [];
    slate.txnHash = event.transaction.hash.toHexString();
    slate.creationBlock = event.block.number;
    slate.creationTime = event.block.timestamp;
  }

  let i = 0;
  let dsChief = DSChief.bind(event.address);
  let slateResponse = dsChief.try_slates(slateID, BigInt.fromI32(i));
  while (!slateResponse.reverted) {
    let spellAddress = slateResponse.value;

    let spellID = spellAddress.toHexString();
    let spell = Spell.load(spellID);
    if (!spell) {
      spell = new Spell(spellID);
      spell.description = "";
      spell.state = SpellState.ACTIVE;
      spell.creationBlock = event.block.number;
      spell.creationTime = event.block.timestamp;

      let dsSpell = DSSpell.bind(spellAddress);
      let dsDescription = dsSpell.try_description();
      if (!dsDescription.reverted) {
        spell.description = dsDescription.value;
      }
      spell.totalVotes = BIGINT_ZERO;
      spell.totalWeightedVotes = BIGINT_ZERO;

      // Track this new spell
      // DSSpellTemplate.create(spellAddress);
    }

    let voteId = sender
      .concat("-")
      .concat(slateID.toHexString())
      .concat("-")
      .concat(spellID);
    // Check for double vote
    let vote = Vote.load(voteId);
    if (vote) {
      log.error("Vote double count {}, txn {}, subtracting previous vote", [
        voteId,
        event.transaction.hash.toHexString(),
      ]);
      // subtract previous vote weight
      spell.totalWeightedVotes = spell.totalWeightedVotes.minus(vote.weight);
      spell.totalVotes = spell.totalVotes.minus(BIGINT_ONE);
    }
    // overwrite vote
    vote = new Vote(voteId);
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

    slate.yays = slate.yays.concat([spellID]);

    // loop through slate indices until a revert breaks it
    slateResponse = dsChief.try_slates(slateID, BigInt.fromI32(++i));
  }
  slate.save();

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
}
