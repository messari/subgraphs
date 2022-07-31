import streamlit as st
from streamlit_autorefresh import st_autorefresh
import altair as alt
import pandas as pd
from subgrounds.subgrounds import Subgrounds

# Refresh every 30 seconds
REFRESH_INTERVAL_SEC = 30

sg = Subgrounds()
erc20Subgraph = sg.load_subgraph("https://api.thegraph.com/subgraphs/name/corerouter/erc20")

def fetch_tokens(subgraph):
    tokens = subgraph.Query.tokens(
        orderBy='id', 
        orderDirection='desc',
        first=10
    )

    df = sg.query_df(
        [
            tokens.id,
            tokens.symbol,
            tokens.totalSupply,
            tokens.holderCount,
            tokens.transferCount
        ]
    )

    df = df.rename(
        columns=lambda x: x[len("tokens_") :]
    )
   
    df["address"] = df["id"]
    df["totalSupply"] = df["totalSupply"].map("{:,.0f}".format)
    df["holderCount"] = df["holderCount"].map("{:,.0f}".format)
    df["transferCount"] = df["transferCount"].map("{:,.0f}".format)

    return df[["symbol", "totalSupply", "holderCount", "transferCount", "address"]]

def fetch_account_token(subgraph, tokenAddress):
    accountBalances = subgraph.Query.accountBalances(
        orderBy='amount', 
        orderDirection='desc',
        first=10,
        where={
            'token' : tokenAddress
        }
    )
    account_df = sg.query_df(
        [
            accountBalances.account,
            accountBalances.amount
        ]
    )

    tokenDailySnapshots = subgraph.Query.tokenDailySnapshots(
        orderBy='id', 
        orderDirection='desc',
        first=100,
        where={
            'token' : tokenAddress
        }
    )

    token_df = sg.query_df(
        [
            tokenDailySnapshots.id,
            tokenDailySnapshots.dailyTransferCount,
            tokenDailySnapshots.dailyTransferAmount
        ]
    )

    if account_df.empty | token_df.empty:
        return account_df,token_df

    account_df = account_df.rename(
        columns=lambda x: x[len("accountBalances_") :]
    )
    account_df["amount"] = account_df["amount"].map("{:,.2f}".format)

    token_df = token_df.rename(
        columns=lambda x: x[len("tokenDailySnapshots_") :]
    )
    token_df["Date"] = pd.to_datetime(token_df["id"].str.split("-").apply(lambda x: x[1]), unit="d").dt.date
    token_df = token_df.drop(columns="id")

    return account_df,token_df


st.set_page_config(layout="wide")
ticker = st_autorefresh(interval=REFRESH_INTERVAL_SEC * 1000, key="ticker")
st.title("ERC20 Token Analytics")

data_loading = st.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data...")
df = fetch_tokens(erc20Subgraph)
data_loading.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data... done!")

st.header("Token list")
st.markdown(df.to_markdown())

st.header("Specific Token Metrics")
symbol = st.selectbox(
    "Select token",
    df["symbol"]
)

tokenAddress = df.loc[df['symbol'] == symbol, 'address'].iloc[0]
data_loading = st.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data...")
account_df,token_df = fetch_account_token(erc20Subgraph, tokenAddress)
data_loading.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data... done!")

if(account_df.empty | token_df.empty):
    st.write("No data yet.")
else:
    st.header("Top Account")
    st.markdown(account_df.to_markdown())

    st.header("Token Daily Snapshot")
    token_snapshot_dailyTransferCount_line_chart = (
        alt.Chart(token_df)
        .mark_line()
        .encode(
            x="Date:T",
            y="dailyTransferCount:Q"
        )
    )
    st.altair_chart(token_snapshot_dailyTransferCount_line_chart, use_container_width=True)

    token_snapshot_dailyTransferAmount_line_chart = (
        alt.Chart(token_df)
        .mark_line()
        .encode(
            x="Date:T",
            y="dailyTransferAmount:Q"
        )
    )
    st.altair_chart(token_snapshot_dailyTransferAmount_line_chart, use_container_width=True)
