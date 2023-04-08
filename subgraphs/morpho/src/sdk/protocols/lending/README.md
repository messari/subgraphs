# Lending SDK `1.0.1`

The lending SDK follows the `3.0.0` lending schema. You can learn about each `manager` class in the class headers, but there are a few things to note.

As a general rule of thumb you want to do a few things before you create an `event` entity. Whether that is in the `Deposit` handler or a unique handler before that.

- You want to update market/protocol data.
  - This includes price, input token balance, and borrow balance, etc.
  - The function to do that is `DataManager.updateMarketAndProtocolData()`
- It is also standard to update revenue or rewards here as well (of course it may be different depending on the protocol)
  - The revenue update functions are:
    - `DataManager.addProtocolRevenue()` and it takes an optional `Fee` that the revenue is associated with
    - `DataManager.addSupplyRevenue()` with the optional `Fee`
  - For rewards you can use `DataManager.updateRewards()`

> Note: The `_reference_` subgraph will not build and deploy. It is a place to see standards that you can copy into your subgraph.

### Questions / Fixes

If you find anything incorrect or have questions please feel free to make a [PR](https://github.com/messari/subgraphs/blob/master/docs/CONTRIBUTING.md) to fix it or raise an [issue](https://github.com/messari/subgraphs/issues/new).
