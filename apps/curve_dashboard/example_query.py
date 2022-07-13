from subgrounds import Subgrounds
import pandas as pd
import time

sg = Subgrounds()

subgraph = sg.load_subgraph("https://api.thegraph.com/subgraphs/name/messari/curve-finance-ethereum")
subgraph._transforms = []

t0 = time.time()
#Define Query Fieldpath
liquidity_pools = subgraph.Query.liquidityPools(
    orberBy=subgraph.LiquidityPool.dailySnapshots.totalValueLockedUSD,
    orderDirection="desc",
    #331 Curve Pools
    where=[subgraph.LiquidityPool.totalValueLockedUSD > 500000],
    first=1,
)

t1 = time.time()
#Query
df = sg.query_df([
    liquidity_pools.dailySnapshots.pool.symbol,
    liquidity_pools.dailySnapshots.outputTokenPriceUSD,
    liquidity_pools.dailySnapshots.timestamp(),
    liquidity_pools.dailySnapshots.totalValueLockedUSD,
    liquidity_pools.dailySnapshots.pool.inputTokens.name,
    liquidity_pools.dailySnapshots.inputTokenWeights,
    liquidity_pools.dailySnapshots.inputTokenBalances,
]) 

t2 = time.time()
#Group
snapshot_cols = df[0].columns.tolist()
snapshot_cols.remove("liquidityPools_dailySnapshots_pool_inputTokens_name")
snapshot_df_0 = df[0].groupby(snapshot_cols, axis=0)['liquidityPools_dailySnapshots_pool_inputTokens_name'].apply(list).reset_index()

snapshot_cols = df[1].columns.tolist()
snapshot_cols.remove("liquidityPools_dailySnapshots_inputTokenWeights")
snapshot_df_1 = df[1].groupby(snapshot_cols, axis=0)['liquidityPools_dailySnapshots_inputTokenWeights'].apply(list).reset_index()

snapshot_cols = df[2].columns.tolist()
snapshot_cols.remove("liquidityPools_dailySnapshots_inputTokenBalances")
snapshot_df_2 = df[2].groupby(snapshot_cols, axis=0)['liquidityPools_dailySnapshots_inputTokenBalances'].apply(list).reset_index()
t3 = time.time()

t4 = time.time()
#Merge
df = pd.merge(snapshot_df_0, pd.merge(snapshot_df_1, snapshot_df_2))
t5 = time.time()
print(df)

print("fieldpath {}".format(t1-t0))
print("query {}".format(t2-t1))
print("data_group {}".format(t3-t2))
print("total {}".format(t5-t0))
print("merge {}".format(t5-t4))
