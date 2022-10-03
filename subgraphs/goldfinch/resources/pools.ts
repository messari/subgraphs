// These are some bogus pools that exist on mainnet, but they aren't real so they should be excluded from the subgraph
//
// @dev We have to create the set this way so it can be used in the `subgraph`. Graph Protocol compiles into AssemblyScript
//   which is _similar to_ but not the same as Typescript. One limitation is that the Set object does not support instantiation
//   from an iterator: https://www.assemblyscript.org/stdlib/set.html
export const INVALID_POOLS = new Set<string>()
INVALID_POOLS.add("0x0e2e11dc77bbe75b2b65b57328a8e4909f7da1eb")
INVALID_POOLS.add("0x4b2ae066681602076adbe051431da7a3200166fd")
INVALID_POOLS.add("0x6b42b1a43abe9598052bb8c21fd34c46c9fbcb8b")
INVALID_POOLS.add("0x7bdf2679a9f3495260e64c0b9e0dfeb859bad7e0")
INVALID_POOLS.add("0x95715d3dcbb412900deaf91210879219ea84b4f8")
INVALID_POOLS.add("0xa49506632ce8ec826b0190262b89a800353675ec")
INVALID_POOLS.add("0xfce88c5d0ec3f0cb37a044738606738493e9b450")
