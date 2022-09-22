import { Spell } from "../generated/schema";
import { CastCall } from "../generated/DSChief/DSSpell";

export function handleCast(call: CastCall): void {
  let spellID = call.to.toHexString(); // spell address is the spellID
  let spell = Spell.load(spellID);
  if (!spell) return;
  spell.cast = true;
  spell.castBlock = call.block.number;
  spell.castWith = spell.totalWeightedVotes;
  spell.save();
}
