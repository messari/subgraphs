import { clearStore, test, assert } from "matchstick-as/assembly/index";
// import { Gravatar } from "../../generated/schema";
// import { NewGravatar } from "../../generated/Gravity/Gravity";
// import { createNewGravatarEvent, handleNewGravatars } from "../mappings/gravity";

// test("Can call mappings with custom events", () => {
//   // Initialise
//   let gravatar = new Gravatar("gravatarId0");
//   gravatar.save();

//   // Call mappings
//   let newGravatarEvent = createNewGravatarEvent(
//       12345,
//       "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
//       "cap",
//       "pac",
//   );

//   let anotherGravatarEvent = createNewGravatarEvent(
//       3546,
//       "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
//       "cap",
//       "pac",
//   );

//   handleNewGravatars([newGravatarEvent, anotherGravatarEvent]);

//   assert.fieldEquals(
//       GRAVATAR_ENTITY_TYPE,
//       "gravatarId0",
//       "id",
//       "gravatarId0",
//   );
//   assert.fieldEquals(GRAVATAR_ENTITY_TYPE, "12345", "id", "12345");
//   assert.fieldEquals(GRAVATAR_ENTITY_TYPE, "3546", "id", "3546");
//   clearStore();
// });

test("First test", () => {
  console.log('Test: Hello World!');
});