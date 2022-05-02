const GravatarRegistry = artifacts.require('./GravatarRegistry.sol')

module.exports = async function(deployer) {
  const registry = await GravatarRegistry.deployed()

  console.log('Account address:', registry.address)

  let accounts = await web3.eth.getAccounts()
  await registry.createGravatar('Carl', 'https://thegraph.com/img/team/team_04.png', {
    from: accounts[0],
  })
  await registry.createGravatar('Lucas', 'https://thegraph.com/img/team/bw_Lucas.jpg', {
    from: accounts[1],
  })
}
