export function handleTransfer(event: Transfer): void {
  let entity = new LidoTransfer(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.transactionIndex = event.transaction.index
  entity.logIndex = event.logIndex
  entity.transactionLogIndex = event.transactionLogIndex

  let fromZeros =
    event.params.from ==
    Address.fromString('0x0000000000000000000000000000000000000000')

  let totalRewardsEntity = TotalReward.load(event.transaction.hash.toHex())

  // We know that for rewards distribution shares are minted with same from 0x0 address as staking
  // We can save this indicator which helps us distinguish such mints from staking events
  entity.mintWithoutSubmission = totalRewardsEntity ? true : false

  // Entity is already created at this point
  let totals = Totals.load('') as Totals

  entity.totalPooledEther = totals.totalPooledEther
  entity.totalShares = totals.totalShares

  let shares = event.params.value
    .times(totals.totalShares)
    .div(totals.totalPooledEther)

  if (!fromZeros) {
    entity.shares = shares
  }

  // We'll save the entity later

  let isMintToTreasury = fromZeros && event.params.to == getAddress('Treasury')

  // If insuranceFee on totalRewards exists, then next transfer is of dust to treasury
  let insuranceFeeExists =
    !!totalRewardsEntity && !!totalRewardsEntity.insuranceFee
  let isDust = isMintToTreasury && insuranceFeeExists

  if (totalRewardsEntity && isMintToTreasury && !isDust) {
    // Handling the Insurance Fee transfer event to treasury

    entity.shares = totalRewardsEntity.sharesToInsuranceFund

    totalRewardsEntity.insuranceFee = event.params.value

    totalRewardsEntity.totalRewards = totalRewardsEntity.totalRewards.minus(
      event.params.value
    )
    totalRewardsEntity.totalFee = totalRewardsEntity.totalFee.plus(
      event.params.value
    )

    totalRewardsEntity.save()
  } else if (totalRewardsEntity && isMintToTreasury && isDust) {
    // Handling dust transfer event

    entity.shares = totalRewardsEntity.dustSharesToTreasury

    totalRewardsEntity.dust = event.params.value

    totalRewardsEntity.totalRewards = totalRewardsEntity.totalRewards.minus(
      event.params.value
    )
    totalRewardsEntity.totalFee = totalRewardsEntity.totalFee.plus(
      event.params.value
    )

    totalRewardsEntity.save()
  } else if (totalRewardsEntity && fromZeros) {
    // Handling node operator fee transfer to node operator

    // Entity should be existent at this point
    let nodeOperatorsShares = NodeOperatorsShares.load(
      event.transaction.hash.toHex() + '-' + event.params.to.toHexString()
    ) as NodeOperatorsShares

    let sharesToOperator = nodeOperatorsShares.shares

    entity.shares = sharesToOperator

    let nodeOperatorFees = new NodeOperatorFees(
      event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    )

    // Reference to TotalReward entity
    nodeOperatorFees.totalReward = event.transaction.hash.toHex()

    nodeOperatorFees.address = event.params.to
    nodeOperatorFees.fee = event.params.value

    totalRewardsEntity.totalRewards = totalRewardsEntity.totalRewards.minus(
      event.params.value
    )
    totalRewardsEntity.totalFee = totalRewardsEntity.totalFee.plus(
      event.params.value
    )

    totalRewardsEntity.save()
    nodeOperatorFees.save()
  }

  if (entity.shares) {
    // Decreasing from address shares
    // No point in changing 0x0 shares
    if (!fromZeros) {
      let sharesFromEntity = Shares.load(event.params.from.toHexString())
      // Address must already have shares, HOWEVER:
      // Someone can and managed to produce events of 0 to 0 transfers
      if (!sharesFromEntity) {
        sharesFromEntity = new Shares(event.params.from.toHexString())
        sharesFromEntity.shares = ZERO
      }

      entity.sharesBeforeDecrease = sharesFromEntity.shares
      sharesFromEntity.shares = sharesFromEntity.shares.minus(entity.shares!)
      entity.sharesAfterDecrease = sharesFromEntity.shares

      sharesFromEntity.save()

      // Calculating new balance
      entity.balanceAfterDecrease = entity
        .sharesAfterDecrease!.times(totals.totalPooledEther)
        .div(totals.totalShares)
    }

    // Increasing to address shares
    let sharesToEntity = Shares.load(event.params.to.toHexString())

    if (!sharesToEntity) {
      sharesToEntity = new Shares(event.params.to.toHexString())
      sharesToEntity.shares = ZERO
    }

    entity.sharesBeforeIncrease = sharesToEntity.shares
    sharesToEntity.shares = sharesToEntity.shares.plus(entity.shares!)
    entity.sharesAfterIncrease = sharesToEntity.shares

    sharesToEntity.save()

    // Calculating new balance
    entity.balanceAfterIncrease = entity
      .sharesAfterIncrease!.times(totals.totalPooledEther)
      .div(totals.totalShares)
  }

  entity.save()
}