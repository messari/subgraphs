from config import *
from st_aggrid import AgGrid
from subgrounds.subgrounds import Subgrounds
from tables import DepositTransactions, SwapTransactions, WithdawTransactions
from metrics import FinancialsDailySnapshots, LiquidityPools, MetricsDailySnapshots

import streamlit as st
from streamlit_echarts import st_pyecharts
st.set_page_config(layout="wide")

st.title("DEX Subgraphs Dashboard")

subgraph_name = st.selectbox(
    label='',
    options=[
        'Sushiswap (Ethereum)', 'Sushiswap (Avax)', 'Uniswap v3 (Ethereum)', 
        'Balancer v2 (Ethereum)', 'Curve (Ethereum)', 'Saddle Finance (Ethereum)'
    ]
)


SUBGROUND = Subgrounds()
SUBGRAPH = SUBGROUND.load_subgraph(SUBGRAPH_API_URL[subgraph_name])

FinancialsSnapshot = FinancialsDailySnapshots(SUBGRAPH, SUBGROUND, initial_timestamp=1601322741)

col1, col2 = st.columns(2)

with col1:
    st_pyecharts(
        chart=FinancialsSnapshot.tvl_chart(),
        height="450px",
        key="TVLChart",
    )

with col2:
    st_pyecharts(
        chart=FinancialsSnapshot.volume_chart(),
        height="450px",
        key="VolumeChart",
    )

col1, col2 = st.columns(2)

with col1:
    st_pyecharts(
        chart=FinancialsSnapshot.revenue_chart(),
        height="450px",
        key="RevenueChart",
    )

with col2:
    st_pyecharts(
        chart=FinancialsSnapshot.cumulative_revenue_chart(),
        height="450px",
        key="CumulativeRevenueChart",
    )


MetricsSnapshot = MetricsDailySnapshots(SUBGRAPH, SUBGROUND, initial_timestamp=1601322741)

with st.container():
    st_pyecharts(
        chart=MetricsSnapshot.transactions_count_chart(),
        height="450px",
        key="TransactionChart",
    )

with st.container():
    st_pyecharts(
        chart=MetricsSnapshot.active_users_chart(),
        height="450px",
        key="ActiveUsersChart",
    )

liquidity_pool = LiquidityPools(SUBGRAPH, SUBGROUND, initial_timestamp=1601322741)

col1, col2 = st.columns(2)

with col1:
    st_pyecharts(
        chart=liquidity_pool.top_10_pools_by_tvl(),
        height="450px",
        key="Top10ByTVL",
    )

with col2:
    st_pyecharts(
        chart=liquidity_pool.top_10_pools_by_volume(),
        height="450px",
        key="Top10ByVolume",
    )

swap = SwapTransactions(SUBGRAPH, SUBGROUND)

if not swap.dataframe.empty:
    st.header("Swap Transactions")
    
    with st.container():
        AgGrid(
            swap.dataframe, 
            editable=True,
            data_return_mode="filtered_and_sorted",
            update_mode="no_update",
            fit_columns_on_grid_load=True, 
            theme="streamlit"
        )

deposits = DepositTransactions(SUBGRAPH, SUBGROUND)

if not deposits.dataframe.empty:
    st.header("Deposit Transactions")
    
    with st.container():
        AgGrid(
            deposits.dataframe, 
            editable=True,
            data_return_mode="filtered_and_sorted",
            update_mode="no_update",
            fit_columns_on_grid_load=True, 
            theme="streamlit"
        )

withdraws = WithdawTransactions(SUBGRAPH, SUBGROUND)

if not withdraws.dataframe.empty:
    st.header("Withdraw Transactions")
    
    with st.container():
        AgGrid(
            withdraws.dataframe, 
            editable=True,
            data_return_mode="filtered_and_sorted",
            update_mode="no_update",
            fit_columns_on_grid_load=True, 
            theme="streamlit"
        )