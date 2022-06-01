import streamlit as st
from streamlit_autorefresh import st_autorefresh
import altair as alt
import pandas as pd
from subgrounds.subgrounds import Subgrounds

# Refresh every 30 seconds
REFRESH_INTERVAL_SEC = 30

sg = Subgrounds()
subgraphs = {
    "matic": sg.load_subgraph(
        "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon"
    ),
    "optimism": sg.load_subgraph(
        "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-optimism"
    ),
    "arbitrum_one": sg.load_subgraph(
        "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum"
    ),
}


def fetch_data(network, subgraph):
    financial_metrics = subgraph.Query.financialsDailySnapshots(
        orderBy=subgraph.FinancialsDailySnapshot.id,
        orderDirection="desc",
        first=100,
    )
    usage_metrics = subgraph.Query.usageMetricsDailySnapshots(
        orderBy=subgraph.UsageMetricsDailySnapshot.id,
        orderDirection="desc",
        first=100,
    )
    financial_df = sg.query_df(
        [
            financial_metrics.id,
            financial_metrics.totalValueLockedUSD,
            financial_metrics.cumulativeVolumeUSD,
            financial_metrics.cumulativeTotalRevenueUSD,
        ]
    )
    usage_df = sg.query_df(
        [
            usage_metrics.id,
            usage_metrics.dailyActiveUsers,
        ]
    )
    financial_df = financial_df.rename(
        columns=lambda x: x[len("financialsDailySnapshots_") :]
    )
    usage_df = usage_df.rename(
        columns=lambda x: x[len("usageMetricsDailySnapshots_") :]
    )
    df = pd.merge(financial_df, usage_df)
    df["network"] = network
    df["date"] = pd.to_datetime(df["id"], unit="d")
    df = df.drop(columns="id")
    return df


st.set_page_config(page_icon="🦄", layout="wide")
ticker = st_autorefresh(interval=REFRESH_INTERVAL_SEC * 1000, key="ticker")
st.title("🦄 Uniswap Analytics")

data_loading = st.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data...")
df = pd.concat(
    map(lambda x: fetch_data(x, subgraphs[x]), ["matic", "optimism", "arbitrum_one"]),
    axis=0,
)
data_loading.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data... done!")

# Plot charts with altair is like a breeze
st.header("Revenue")
rev_stacked_bar_chart = (
    alt.Chart(df)
    .mark_bar()
    .encode(x="date:T", y="cumulativeTotalRevenueUSD:Q", color="network:N")
)
st.altair_chart(rev_stacked_bar_chart, use_container_width=True)

st.header("TVL")
tvl_stacked_bar_chart = (
    alt.Chart(df)
    .mark_bar()
    .encode(x="date:T", y="totalValueLockedUSD:Q", color="network:N")
)
st.altair_chart(tvl_stacked_bar_chart, use_container_width=True)

st.header("Volume")
volume_norm_stacked_area_chart = (
    alt.Chart(df)
    .mark_area()
    .encode(
        x="date:T",
        y=alt.Y("cumulativeVolumeUSD:Q", stack="normalize"),
        color="network:N",
    )
)
st.altair_chart(volume_norm_stacked_area_chart, use_container_width=True)

st.header("DAU")
dau_line_chart = (
    alt.Chart(df)
    .mark_line()
    .encode(
        x="date:T",
        y="dailyActiveUsers:Q",
        color="network:N",
    )
)
st.altair_chart(dau_line_chart, use_container_width=True)
