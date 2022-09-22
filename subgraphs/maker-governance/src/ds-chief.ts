import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { LogNote, DSChief } from "../generated/DSChief/DSChief";
import { DSSpell } from "../generated/DSChief/DSSpell";
import { Slate, Spell, Delegate, Vote } from "../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ONE, BIGINT_ZERO } from "./constants";
import { hexToNumberString, toDecimal } from "./helpers";

function getSlate(id: string): Slate {
  let slate = Slate.load(id);
  if (!slate) {
    slate = new Slate(id);
    slate.yays = [];
  }
  return slate;
}
function getDelegate(address: string): Delegate {
  let delegate = Delegate.load(address);
  if (!delegate) {
    delegate = new Delegate(address);
    delegate.votingPowerRaw = BIGINT_ZERO;
    delegate.votingPower = BIGDECIMAL_ZERO;
    delegate.numberVotes = 0;
  }
  return delegate;
}
function createVote(
  sender: string,
  spellID: string,
  weight: BigInt,
  event: ethereum.Event
): void {
  let voteId = sender.concat("-").concat(spellID);
  let vote = new Vote(voteId);
  vote.weight = weight;
  vote.reason = "";
  vote.voter = sender;
  vote.spell = spellID;
  vote.block = event.block.number;
  vote.blockTime = event.block.timestamp;
  vote.txnHash = event.transaction.hash.toHexString();
  vote.save();
}

export function handleLock(event: LogNote): void {
  let sender = event.params.guy; // guy is the sender
  let amountStr = hexToNumberString(event.params.foo.toHexString());
  let amount = BigInt.fromString(amountStr); //.foo is the amount being locked

  let delegate = getDelegate(sender.toHexString());
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
  let delegate = getDelegate(sender);

  let slateID = event.params.foo; // foo is slate id
  let slate = getSlate(slateID.toHexString());
  slate.txnHash = event.transaction.hash.toHexString();
  slate.creationBlock = event.block.number;
  slate.creationTime = event.block.timestamp;

  let i = 0;
  let dsChief = DSChief.bind(event.address);
  let slateResponse = dsChief.try_slates(slateID, BigInt.fromI32(i));
  while (!slateResponse.reverted) {
    let spellAddress = slateResponse.value;

    let spellID = spellAddress.toHexString();
    let spell = Spell.load(spellID);

    if (!spell) {
      spell = new Spell(spellID);
      spell.creationBlock = event.block.number;
      spell.creationTime = event.block.timestamp;
      spell.description = "";

      let dsSpell = DSSpell.bind(spellAddress);
      let dsDescription = dsSpell.try_description();
      if (!dsDescription.reverted) {
        spell.description = dsDescription.value;
      }
      spell.totalVotes = BIGINT_ZERO;
      spell.totalWeightedVotes = BIGINT_ZERO;
    }
    spell.totalVotes = spell.totalVotes.plus(BIGINT_ONE);
    spell.totalWeightedVotes = spell.totalWeightedVotes.plus(
      delegate.votingPowerRaw
    );
    spell.save();

    createVote(sender, spellID, delegate.votingPowerRaw, event);

    if (slate.yays.length == 0) {
      slate.yays = slate.yays.concat([spellID]);
    }

    // loop through slate indices until a revert breaks it
    slateResponse = dsChief.try_slates(slateID, BigInt.fromI32(++i));
  }
  slate.save();
}
