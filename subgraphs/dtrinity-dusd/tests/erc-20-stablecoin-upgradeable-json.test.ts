import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { AdminChanged } from "../generated/schema"
import { AdminChanged as AdminChangedEvent } from "../generated/ERC20StablecoinUpgradeable.json/ERC20StablecoinUpgradeable.json"
import { handleAdminChanged } from "../src/erc-20-stablecoin-upgradeable-json"
import { createAdminChangedEvent } from "./erc-20-stablecoin-upgradeable-json-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let previousAdmin = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newAdmin = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newAdminChangedEvent = createAdminChangedEvent(previousAdmin, newAdmin)
    handleAdminChanged(newAdminChangedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AdminChanged created and stored", () => {
    assert.entityCount("AdminChanged", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AdminChanged",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "previousAdmin",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "AdminChanged",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newAdmin",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
