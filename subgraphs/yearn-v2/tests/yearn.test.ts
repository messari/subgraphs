import { clearStore, test, assert } from 'matchstick-as/assembly/index'
// import { Gravatar } from '../generated/schema'
// import { createNewGravatarEvent, handleNewGravatars } from '../mappings/gravity'

export function runTests(): void {
  test('Can call mappings with custom events', () => {
    // Initialise
    // let gravatar = new Gravatar('gravatarId0')
    // gravatar.save()

    // // Call mappings
    // let newGravatarEvent = createNewGravatarEvent(12345, '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7', 'cap', 'pac')

    // let anotherGravatarEvent = createNewGravatarEvent(3546, '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7', 'cap', 'pac')

    // handleNewGravatars([newGravatarEvent, anotherGravatarEvent])

    assert.fieldEquals('Gravatar', 'gravatarId0', 'id', 'gravatarId0')
    assert.fieldEquals('Gravatar', '12345', 'owner', '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7')
    assert.fieldEquals('Gravatar', '3546', 'displayName', 'cap')

    clearStore()
  })

  test('Next test', () => {
    //...
    // console.log("hello")
  })
}
