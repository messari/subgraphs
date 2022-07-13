import streamlit as st
import altair as alt
import pandas as pd
from subgrounds import Subgrounds
from itertools import cycle
from datetime import datetime, timedelta

sg = Subgrounds()
subgraphs_urls = {
        'gnosis': "https://api.thegraph.com/subgraphs/name/messari/curve-finance-gnosis",
        'optimism': "https://api.thegraph.com/subgraphs/name/messari/curve-finance-optimism",
        'fantom': "https://api.thegraph.com/subgraphs/name/messari/curve-finance-fantom",
        'ethereum': "https://api.thegraph.com/subgraphs/name/messari/curve-finance-ethereum",
}
network_list = ['ethereum', 'gnosis', 'optimism', 'fantom']

def load_subgraph(url):
    subgraph = sg.load_subgraph(url)
    subgraph._transforms = []
    return subgraph

def get_data(subgraph, network, startTime, numberPools):
    #Define Query Fieldpath
    liquidity_pools = subgraph.Query.liquidityPools(
        orberBy=subgraph.LiquidityPool.totalValueLockedUSD,
        orderDirection="desc",
        where=[subgraph.LiquidityPool.totalValueLockedUSD > 500000],
        first=numberPools
    )

    lp_snapshots = liquidity_pools.dailySnapshots(
        orderBy=liquidity_pools.dailySnapshots.timestamp,
        where=[liquidity_pools.dailySnapshots.timestamp > int(startTime.timestamp())],
    )

    #Query
    df = sg.query_df([
        liquidity_pools.symbol,
        liquidity_pools.inputTokens.name,
        liquidity_pools.totalValueLockedUSD,
        lp_snapshots.timestamp,
        lp_snapshots.totalValueLockedUSD,
        lp_snapshots.inputTokenWeights,
        lp_snapshots.inputTokenBalances,
    ])

    dec = sg.query_df([
        liquidity_pools.inputTokens.name,
        liquidity_pools.inputTokens.decimals
    ])

    #Group
    dec_dict = (pd.Series(dec.liquidityPools_inputTokens_decimals.values, index=dec.liquidityPools_inputTokens_name).to_dict())
    
    snapshot_cols = df[0].columns.tolist()
    snapshot_cols.remove("liquidityPools_inputTokens_name")
    df_0 = df[0].groupby(snapshot_cols, axis=0)['liquidityPools_inputTokens_name'].apply(list).reset_index()

    snapshot_cols = df[1].columns.tolist()
    snapshot_cols.remove("liquidityPools_dailySnapshots_inputTokenWeights")
    df_1 = df[1].groupby(snapshot_cols, axis=0)['liquidityPools_dailySnapshots_inputTokenWeights'].apply(list).reset_index()

    snapshot_cols = df[2].columns.tolist()
    snapshot_cols.remove("liquidityPools_dailySnapshots_inputTokenBalances")
    df_2 = df[2].groupby(snapshot_cols, axis=0)['liquidityPools_dailySnapshots_inputTokenBalances'].apply(list).reset_index()

    df = pd.merge(df_0, pd.merge(df_1, df_2))

    #Will figure out a cleaner way of doing it. I originally grouped the token properties together so there wouldn't be any duplicate rows in the dataframe
    df['InputTokenPrice0'] = (df['liquidityPools_dailySnapshots_totalValueLockedUSD'].astype('float64') * df['liquidityPools_dailySnapshots_inputTokenWeights'].apply(lambda x:x[0]).astype('float64')) / (df['liquidityPools_dailySnapshots_inputTokenBalances'].apply(lambda x:x[0]).astype('float64') / 10**df['liquidityPools_inputTokens_name'].apply(lambda x:dec_dict[x[0]]).astype('float64'))
    df['InputTokenPrice1'] = (df['liquidityPools_dailySnapshots_totalValueLockedUSD'].astype('float64') * df['liquidityPools_dailySnapshots_inputTokenWeights'].apply(lambda x:x[1]).astype('float64')) / (df['liquidityPools_dailySnapshots_inputTokenBalances'].apply(lambda x:x[1]).astype('float64') / 10**df['liquidityPools_inputTokens_name'].apply(lambda x:dec_dict[x[1]]).astype('float64'))
    df['%depeg'] = ((abs(1 - df['InputTokenPrice0'].astype('float64')) / 1)).round(9)
    df["network"] = network
    df["date"] = pd.to_datetime(df['liquidityPools_dailySnapshots_timestamp'], unit="s")
    df = df.rename(columns={'liquidityPools_inputTokens_name': 'inputTokens', 'liquidityPools_totalValueLockedUSD': 'TVL'})
     
    return df

def plot_pools(sort, data):
    grouped = data.groupby('liquidityPools_symbol')
    pool_snapshots = [group for _, group in grouped]
    sorted_pool_snapshots = sorted(pool_snapshots, key=lambda x:x[sort].max(axis=0), reverse=True)
    st.header(data['network'].iloc[0])
    cols = st.columns(2)
    for col, pool in zip(cycle(cols), sorted_pool_snapshots):
        with col: 
            frame = pool.explode(['inputTokens','liquidityPools_dailySnapshots_inputTokenWeights'])
            frame.index = pd.to_datetime(frame.index)
            frame.resample("D").mean().ffill()
            tvl_chart = (alt.Chart(frame).mark_bar().encode(
                    x='date:T', 
                    y=alt.Y('sum(liquidityPools_dailySnapshots_inputTokenWeights):Q', title="Input Token Weight"), 
                    color='inputTokens')
            ).configure_legend(
                    strokeColor='gray',
                    fillColor='#EEEEEE',
                    padding=2,
                    cornerRadius=5,
                    orient='bottom'
            )

            chart1 = alt.Chart(frame).mark_line().encode(
                x='date:T',
                y=alt.Y('InputTokenPrice0:Q',  
                        title='Input Token Price (USD)'
                ),
            ).properties(
                height=70,
                width=250
            )

            chart2 = alt.Chart(frame).mark_line().encode(
                x='date:T',
                y=alt.Y('%depeg:Q', axis=alt.Axis(format='%')),
            ).properties(
                height=70,
                width=250
            )
            fig = alt.vconcat(chart1, chart2)

            st.subheader(pool['liquidityPools_symbol'].iloc[0])
            st.altair_chart(tvl_chart, use_container_width=True)
            st.altair_chart(fig, use_container_width=True)

st.title("Curve Pool Composition Dashboard")

#Sidebar Form 
st.sidebar.header("Select Curve Pools")
form = st.sidebar.form('select')
sort = form.selectbox("Sort By", ("TVL", "%depeg"))
network = form.radio('Network:', network_list)
days = form.slider("Timeframe: (Past x days)", min_value=1, max_value=30, step=1)
full_history = form.checkbox("Plot Complete Pool History")
number_pools = form.slider('Number Pools:', min_value=1, max_value=200, step=1)
submitted = form.form_submit_button("Submit")

if submitted:
    start_time = datetime.today() - timedelta(days=days)
    if full_history:
        #Set to Unix Epoch to source entire history
        start_time = datetime(1970, 1, 1)
    pools = get_data(load_subgraph(subgraphs_urls[network]), network, start_time, number_pools)
    plot_pools(sort, pools)
#TODO: Add Interactive elements to charts
#TODO: Interpolation
#TODO: Format %depeg and input token price correctly
