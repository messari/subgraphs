import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { LogNote, DSChief, Etch } from "../generated/DSChief/DSChief";
import { DSSpell } from "../generated/DSChief/DSSpell";
import { Slate, Spell } from "../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO, SpellState } from "./constants";
import {
  createVote,
  getDelegate,
  hexToNumberString,
  toDecimal,
} from "./helpers";
import { DSSpell as DSSpellTemplate } from "../generated/templates";

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
      DSSpellTemplate.create(spellAddress);
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

  delegate.slate = slate.id;
  delegate.numberVotes = delegate.numberVotes + 1;
  delegate.save();
}
export function handleLift(event: LogNote): void {
  let spellID = event.params.foo.toHexString(); // foo is the spellID
  let spell = Spell.load(spellID);
  if (!spell) return;

  spell.state = SpellState.LIFTED;
  spell.liftedTxnHash = event.transaction.hash.toHexString();
  spell.liftedTime = event.block.timestamp;
  spell.liftedWith = spell.totalWeightedVotes;
  spell.save();
}
