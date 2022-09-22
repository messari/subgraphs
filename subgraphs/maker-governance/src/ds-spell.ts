import { LogNote } from "../generated/DSChief/DSChief";
import { Spell } from "../generated/schema";

export function handleCast(event: LogNote): void {
  let spellID = event.params.foo.toHexString(); // foo is the spellID

  let spell = Spell.load(spellID);
  if (!spell) return;
  spell.cast = true;
  spell.castBlock = event.block.number;
  spell.castWith = spell.totalWeightedVotes;
  spell.save();
}
