import { BigInt } from "@graphprotocol/graph-ts";
import { Etch, LogNote, DSChief } from "../generated/DSChief/DSChief";
import { DSSpell } from "../generated/DSChief/DSSpell";
import { Slate, Spell, Delegate, Vote } from "../generated/schema";

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
function getSlate(id: string): Slate {
  let slate = Slate.load(id);
  if (!slate) {
    slate = new Slate(id);
    slate.yays = [];
  }
  return slate;
}

export function handleVote(event: LogNote): void {
  let slateID = event.params.foo; // foo is slate id
  let slate = getSlate(slateID.toHexString());
  slate.txnHash = event.transaction.hash.toHexString();
  slate.creationBlock = event.block.number;
  slate.creationTime = event.block.timestamp;
  slate.save();

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

      let dsSpell = DSSpell.bind(spellAddress);
      let dsDescription = dsSpell.try_description();
      let dsDone = dsSpell.try_done();
      if (!dsDescription.reverted && !dsDone.reverted) {
        spell.description = dsDescription.value;
        spell.done = dsDone.value;
      }
      spell.totalVotes = BIGINT_ZERO;
      spell.totalWeightedVotes = BIGINT_ZERO;
    }
    spell.totalVotes = spell.totalVotes.plus(BIGINT_ONE);
    // TODO: Increment totalWeightedVotes

    if (slate.yays.length == 0) {
      slate.yays = slate.yays.concat([spellID]);
    }

    // loop through slate indices until a revert breaks
    slateResponse = dsChief.try_slates(slateID, BigInt.fromI32(++i));
  }
}

// export function handleLogSetAuthority(event: LogSetAuthority): void {}

// export function handleLogSetOwner(event: LogSetOwner): void {}
