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
        orderBy=subgraph.LiquidityPool.totalValueLockedUSD,
        orderDirection="desc",
        where={"totalValueLockedUSD_gt": 500000, "dailySnapshots_": {"timestamp_gt": int(startTime.timestamp())}},
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
    df = df.rename(columns={'liquidityPools_inputTokens_name': 'input_tokens_name', 
                            'liquidityPools_dailySnapshots_inputTokenWeights': 'daily_input_tokens_weight',
                            'liquidityPools_dailySnapshots_inputTokenBalances': 'daily_input_tokens_balance', 
                            'liquidityPools_dailySnapshots_totalValueLockedUSD': 'daily_tvl', 
                            'liquidityPools_totalValueLockedUSD': 'TVL'})
    df['daily_input_tokens_price'] = df.apply(lambda x: calc_input_token_price(x, dec_dict), axis=1)
    df['%depeg'] = df.apply(lambda x: calc_depeg(x), axis=1)
    df["network"] = network
    df["date"] = pd.to_datetime(df['liquidityPools_dailySnapshots_timestamp'], unit="s")

    return df

def calc_depeg(df):

    return [round((1 - float(df['daily_input_tokens_price'][i])), 5) for i in range(len(df['input_tokens_name']))]

def calc_input_token_price(df, dict):
    input_token_prices = []
    # This isn't the best solution as its looping in python but given how there is a small number of tokens in a pool shouldn't be to big a hit to performance
    for i in range(len(df['input_tokens_name'])):
        if(float(df['daily_input_tokens_balance'][i]) != 0):
            input_token_price = (float(df['daily_tvl']) * float(df['daily_input_tokens_weight'][i])
                                / (int(df['daily_input_tokens_balance'][i]) / 10**dict[df['input_tokens_name'][i]]))
        else:
            input_token_price = 0
        input_token_prices.append(input_token_price)

    return input_token_prices


def plot_pools(sort, data):
    grouped = data.groupby('liquidityPools_symbol')
    pool_snapshots = [group for _, group in grouped]
    sorted_pool_snapshots = sorted(pool_snapshots, key=lambda x:x[sort].max(axis=0), reverse=True)
    st.header(data['network'].iloc[0])
    cols = st.columns(2)
    for col, pool in zip(cycle(cols), sorted_pool_snapshots):
        with col: 
            frame = pool.explode(['input_tokens_name', '%depeg', 'daily_input_tokens_price', 'daily_input_tokens_weight'])
            tvl_chart = (alt.Chart(frame).mark_bar().encode(
                    x='date:T', 
                    y=alt.Y('sum(daily_input_tokens_weight):Q',
                            title="Input Token Weight"),
                    color='input_tokens_name'
            ).configure_legend(
                    strokeColor='gray',
                    fillColor='#EEEEEE',
                    padding=2,
                    cornerRadius=5,
                    orient='bottom'
            ))

            chart1 = alt.Chart(frame).mark_line().encode(
                x='date:T',
                y=alt.Y('daily_input_tokens_price:Q',  
                        title='Input Token Price (USD)'),
                color='input_tokens_name',
            ).properties(
                height=70,
                width=250
            )

            chart2 = alt.Chart(frame).mark_line().encode(
                x='date:T',
                y='%depeg:Q',
                color='input_tokens_name',
            ).properties(
                height=70,
                width=250
            )

            fig = alt.vconcat(chart1, chart2).configure_legend(
                    strokeColor='gray',
                    fillColor='#EEEEEE',
                    padding=2,
                    cornerRadius=5,
                    orient='bottom'
            )

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
