from utilities.coingecko import get_coin_market_cap, get_market_data
from subgrounds.subgrounds import Subgrounds
from streamlit_autorefresh import st_autorefresh
from datetime import datetime
import streamlit as st
import altair as alt
import pandas as pd

# Refresh every 30 seconds
REFRESH_INTERVAL_SEC = 30

# Initialize Subgrounds
SUBGRAPH_URL = "https://api.thegraph.com/subgraphs/name/messari/makerdao-ethereum" # messari/makerdao-ethereum
sg = Subgrounds()
makerdao = sg.load_subgraph(SUBGRAPH_URL)
#  python3.10 -m streamlit run protocols/makerdao.py 

x= ["0xF72beaCc6fD334E14a7DDAC25c3ce1Eb8a827E10",
 "0xb0D2EB3C2cA3c6916FAb8DCbf9d9c165649231AE",
 "0x065f44cd602cc6680e82e516125839b9bbbbe57e",
 "0x850c7cc8757ce1fa8ced709f297d842e12e61759",
 "0xaea2e71b631fa93683bcf256a8689dfa0e094fcd",
 "0x6041631c566eb8dc6258a75fa5370761d4873990",
 "0xf92c2a3c91bf869f77f9cb221c5ab1b1ada8a586",
 "0xe9dcf2d2a17ead11fab8b198578b20535370be6a",
 "0x30df229cefa463e991e29d42db0bae2e122b2ac7"]

x = [a.lower() for a in x]
#####################
##### Streamlit #####
#####################

st.set_page_config(layout="wide")
ticker = st_autorefresh(interval=REFRESH_INTERVAL_SEC * 1000, key="ticker")
st.title("MakerDao Analytics")

data_loading = st.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data...")


def format_currency(x):
    return "${:.1f}K".format(x/1000)


def get_financial_snapshots(subgraph):
    financialSnapshot = subgraph.Query.financialsDailySnapshots(
    orderBy=subgraph.FinancialsDailySnapshot.timestamp,
    orderDirection='desc',
    first=100
    )
    df = sg.query_df([
    financialSnapshot.id,
    financialSnapshot.totalValueLockedUSD,
    financialSnapshot.dailyProtocolSideRevenueUSD,
    financialSnapshot.dailySupplySideRevenueUSD,
    financialSnapshot.dailyTotalRevenueUSD,
    financialSnapshot.totalDepositBalanceUSD,
    financialSnapshot.totalBorrowBalanceUSD,
    financialSnapshot.dailyDepositUSD,
    financialSnapshot.dailyBorrowUSD,
    financialSnapshot.dailyLiquidateUSD,
    financialSnapshot.cumulativeBorrowUSD,
    financialSnapshot.cumulativeLiquidateUSD,
    financialSnapshot.mintedTokenSupplies,
    financialSnapshot.timestamp,
    ])
    df['Date'] = df['financialsDailySnapshots_id'].apply(lambda x: datetime.utcfromtimestamp(int(x)*86400))
    df['Collateralization Ratio'] = df['financialsDailySnapshots_totalBorrowBalanceUSD'] / df['financialsDailySnapshots_totalDepositBalanceUSD']
    df['financialsDailySnapshots_mintedTokenSupplies'] = df['financialsDailySnapshots_mintedTokenSupplies'].apply(lambda x: float(x)/1e18)
    df['Dai Supply'] = [row['financialsDailySnapshots_mintedTokenSupplies'] for i,row in df.iterrows()]
    df = df.rename(columns={
        'financialsDailySnapshots_cumulativeBorrowUSD':'Loan Origination',
        'financialsDailySnapshots_cumulativeLiquidateUSD':'Cumulative Liquidations',
        'financialsDailySnapshots_dailyBorrowUSD':'Daily Borrows USD',
        'financialsDailySnapshots_dailyLiquidateUSD':'Daily Liquidations USD',
        'financialsDailySnapshots_dailyDepositUSD':'Daily Deposits USD',
        'financialsDailySnapshots_dailyTotalRevenueUSD':'Daily Total Revenue',
        'financialsDailySnapshots_dailySupplySideRevenueUSD':'Daily Supply Revenue',
        'financialsDailySnapshots_dailyProtocolSideRevenueUSD':'Daily Protocol Revenue',
        'financialsDailySnapshots_totalValueLockedUSD':'Total Value Locked',
        'financialsDailySnapshots_totalDepositBalanceUSD':'Total Deposit Balance',
        'financialsDailySnapshots_totalBorrowBalanceUSD':'Total Borrow Balance'
        })
    print(df)
    return df


def get_usage_metrics_df(subgraph):
    usageMetrics = subgraph.Query.usageMetricsDailySnapshots(
    orderBy=subgraph.UsageMetricsDailySnapshot.timestamp,
    orderDirection='desc',
    first=100
    )
    df = sg.query_df([
    usageMetrics.id,
    usageMetrics.dailyDepositCount,
    usageMetrics.dailyWithdrawCount,
    usageMetrics.dailyBorrowCount,
    usageMetrics.dailyRepayCount,
    usageMetrics.dailyLiquidateCount,
    usageMetrics.dailyActiveUsers,
    usageMetrics.cumulativeUniqueUsers,
    ])
    df['Date'] = df['usageMetricsDailySnapshots_id'].apply(lambda x: datetime.utcfromtimestamp(int(x)*86400))
    df = df.rename(columns={
        'usageMetricsDailySnapshots_dailyDepositCount':'Daily Deposit Count',
        'usageMetricsDailySnapshots_dailyWithdrawCount':'Daily Withdraw Count',
        'usageMetricsDailySnapshots_dailyBorrowCount':'Daily Borrow Count',
        'usageMetricsDailySnapshots_dailyRepayCount':'Daily Repay Count',
        'usageMetricsDailySnapshots_dailyLiquidateCount':'Daily Liquidation Count',
        'usageMetricsDailySnapshots_dailyActiveUsers':'Daily Active Users',
        'usageMetricsDailySnapshots_cumulativeUniqueUsers':'Cumulative New Users'
        })
    return df


def get_markets_df(subgraph):
    markets = subgraph.Query.markets(
        first=100,
        where=[subgraph.Market.id != '0x0000000000000000000000000000000000000000']
    )
    markets_df = sg.query_df([
        markets.id,
        markets.name,
        markets.totalValueLockedUSD,
        markets.inputToken
    ])
    return markets_df

def get_events_df(subgraph,event_name='Deposit'):
    slug = event_name.lower()+'s'
    event = subgraph.Query.__getattribute__(slug)(
        orderBy=subgraph.__getattribute__(event_name).timestamp,
        orderDirection='desc',
        first=10
    )
    df = sg.query_df([
        event.timestamp,
        event.hash,
        event.__getattribute__('from'),
        event.to,
        event.market.name,
        event.asset.symbol,
        event.amountUSD
    ])
    df = df.rename(columns={
        slug+'_timestamp':'Date',
        slug+'_hash':'Transaction Hash',
        slug+'_from':'From',
        slug+'_to':'To',
        slug+'_market_name':'Market',
        slug+'_asset_symbol':'Asset',
        slug+'_amountUSD':'Amount'
    })
    df['Date'] = df['Date'].apply(lambda x: datetime.utcfromtimestamp(int(x)))
    df['Amount'] = df['Amount'].apply(lambda x: "${:.1f}k".format((x/1000)))
    return df


def get_revenue_df(df):
    mcap_df = get_coin_market_cap('maker')
    revenue_df = df.merge(mcap_df, how='inner', on='Date')
    revenue_df = revenue_df[(revenue_df['Daily Protocol Revenue']>0) | (revenue_df['Daily Total Revenue']>0)]
    revenue_df['P/E Ratio'] = (revenue_df['mcap'] / revenue_df['Daily Protocol Revenue'])/1000
    revenue_df['P/S Ratio'] = (revenue_df['mcap'] / revenue_df['Daily Total Revenue'])/1000
    revenue_df = revenue_df.sort_values(by='Date')[:-1]
    return revenue_df


def get_top_10_markets_tvl(markets_df):
    top_10 = markets_df.sort_values(by='markets_totalValueLockedUSD',ascending=False)[:10]
    top_10 = top_10.rename(columns={'markets_totalValueLockedUSD':'Total Value Locked', 'markets_name':'Market'})
    return top_10


def get_asset_tvl(markets_df):
    assets_df = markets_df.copy()
    for i, row in assets_df.iterrows():
        if row['markets_inputToken_name'] == 'Uniswap V2':
            assets_df.loc[i, 'markets_inputToken_symbol'] = row['markets_name'].split('-')[0]
    assets_df = assets_df.groupby(['markets_inputToken_id', 'markets_inputToken_symbol'])['markets_totalValueLockedUSD'].sum().reset_index()
    assets_df = assets_df[assets_df['markets_totalValueLockedUSD'] >= 1.0]
    assets_df = assets_df.rename(columns={'markets_totalValueLockedUSD': 'Total Value Locked', 'markets_inputToken_symbol': 'Token'})
    return assets_df


def get_financial_statement_df(df):
    financial_df = df[['Date', 'Daily Deposits USD', 'Daily Borrows USD', 'Daily Liquidations USD', 'Total Deposit Balance', 'Total Borrow Balance']]
    return financial_df


def get_stable_ratio(assets_df):
    stablecoins = ['TUSD','GUSD','USDC','PAX','USDT']
    stable_ratio = assets_df[assets_df['Token'].isin(stablecoins)]['Total Value Locked'].sum() / assets_df['Total Value Locked'].sum()
    stable_ratio_df = pd.DataFrame({'ratio': [stable_ratio, 1-stable_ratio], 'Collateral Type': ['STABLE', 'NON-STABLE']})
    return stable_ratio_df


df = get_financial_snapshots(makerdao)
usage_df = get_usage_metrics_df(makerdao)
markets_df = get_markets_df(makerdao)
revenue_df = get_revenue_df(df)

top_10 = get_top_10_markets_tvl(markets_df)
assets_df = get_asset_tvl(markets_df)

data_loading.text(f"[Every {REFRESH_INTERVAL_SEC} seconds] Loading data... done!")

scales = alt.selection_interval(bind='scales')
# Create a selection that chooses the nearest point & selects based on x-value

date_axis = alt.X("Date:T", axis=alt.Axis(title=None, format="%Y-%m-%d", labelAngle=45, tickCount=20))
nearest = alt.selection(type='single', nearest=True, on='mouseover',
                        fields=['Date'], empty='none')


def build_financial_chart(df, column, title=None, y_axis_format='$,.2f',color=None):
    title = column if not title else title
    y_axis = alt.Y(column+":Q", axis=alt.Axis(format=y_axis_format)) if y_axis_format else alt.Y(column+":Q")
    line = alt.Chart(df).mark_line().encode(x=date_axis, y=y_axis, tooltip=[alt.Tooltip("Date")])
    if color:
        line = alt.Chart(df).mark_line().encode(x=date_axis, y=y_axis, tooltip=[alt.Tooltip("Date")],color=color)
    selectors = alt.Chart(df).mark_point().encode(x=date_axis, opacity=alt.value(0),).add_selection(nearest)
    points = line.mark_point().encode(opacity=alt.condition(nearest, alt.value(1), alt.value(0)))
    text = line.mark_text(align='left', dx=5, dy=-5, color='black').encode(text=alt.condition(nearest, column+":Q", alt.value(' ')))
    rules = alt.Chart(df).mark_rule(color='gray').encode(x=date_axis,).transform_filter(nearest)
    line_chart = alt.layer(line, selectors, points, rules, text).interactive().properties(title=title)
    return line_chart


def build_pie_chart(df, theta, color):
    base = alt.Chart(df).encode(
        theta=alt.Theta(theta+':Q', stack=True),
        color=alt.Color(color+':N', legend=None),
        tooltip=[alt.Tooltip(theta),
                 alt.Tooltip(color)]
    )
    pie = base.mark_arc(outerRadius=110)
    text = base.mark_text(radius=130, size=8).encode(text=color)
    return pie + text

def build_tvl_per_asset_pie(assets_df):
    selection = alt.selection_multi(fields=['Token'], bind='legend')
    pie_chart = alt.Chart(assets_df).mark_arc().encode(
        theta=alt.Theta(field="Total Value Locked", type="quantitative"),
        tooltip=[alt.Tooltip("Total Value Locked"), alt.Tooltip("Token")],
        color=alt.condition(selection, 'Token:N', alt.value('white'))
    ).add_selection(selection).configure_legend(
        titleFontSize=14,
        labelFontSize=10,
        columns=2
    )
    return pie_chart


def build_multi_line_rev_chart(revenue_df):
    sub_df = revenue_df[['Date','Daily Protocol Revenue','Daily Supply Revenue']]
    sub_df = sub_df.rename(columns={'Daily Protocol Revenue': 'Protocol', 'Daily Supply Revenue': 'Supply'})
    formatted_df = sub_df.melt(id_vars=['Date'], var_name='Side', value_name='Revenue')
    chart = build_financial_chart(formatted_df,  'Revenue', 'Daily Revenue', color='Side')
    return chart

st.header('Protocol Snapshot')
col1, col2, col3, col4, col5, col6 = st.columns(6)

market_data = get_market_data('maker')

def has_percent(val):
    return True if '%' in val else False

def format_percent_to_float(val):
    return float(val.strip('%'))

def which_color(val):
    if isinstance(val, str):
        val = format_percent_to_float(val) if has_percent(val) else val
    return 'green' if val > 0 else 'red'

def get_colored_text(val):
    text = '<span id="bottom-right" class="is-display-inline-block is-text-align-right" style="font-family:sans-serif; color:{}; font-size: 18px;">{}</span>'.format(which_color(val),val)
    return text

def annualize_value(val_list):
    num_vals = len(val_list)
    annual_val = (sum(val_list) / num_vals) * 365
    return annual_val


with col1:
    st.subheader(market_data["price"])
    st.markdown('24h: {}'.format(get_colored_text(market_data['24hr_change'])) + '$~~~~~$ 7d: {}'.format(get_colored_text(market_data['7d_change'])), unsafe_allow_html=True)
    st.markdown('30d: {}'.format(get_colored_text(market_data['30d_change'])) + '$~~~~$ 1y: {}'.format(get_colored_text(market_data['1y_change'])), unsafe_allow_html=True)

with col2:
    st.header('')
    text = '<span style="color:gray;">Circulating market cap:</span><br><span style="color:black;">{}</span>'.format(market_data['circ_market_cap'])
    st.markdown(text, unsafe_allow_html=True)
    text = '<span style="color:gray;">Fully-diluted market cap:</span><br><span style="color:black;">{}</span>'.format(market_data['fdv_market_cap'])
    st.markdown(text, unsafe_allow_html=True)


with col3:
    st.header('')
    rate_change_rev = (sum(df['Daily Total Revenue'][:30])-sum(df['Daily Total Revenue'][31:60]))/sum(df['Daily Total Revenue'][:30])
    text = '<span style="color:gray;">Total revenue 30d:</span><br>' \
           '<span style="color:black;">{}</span>' \
           '<span style="color:{};"> ({})</span>'.format("${:,.2f}".format(sum(df['Daily Total Revenue'][:30])),which_color(rate_change_rev), '{:.2%}'.format(rate_change_rev))
    st.markdown(text, unsafe_allow_html=True)
    rate_change_rev = (sum(df['Daily Protocol Revenue'][:30])-sum(df['Daily Protocol Revenue'][31:60]))/sum(df['Daily Protocol Revenue'][:30])
    text = '<span style="color:gray;">Total protocol revenue 30d:</span><br>' \
           '<span style="color:black;">{}</span>' \
           '<span style="color:{};"> ({})</span>'.format("${:,.2f}".format(sum(df['Daily Protocol Revenue'][:30])),which_color(rate_change_rev), '{:.2%}'.format(rate_change_rev))
    st.markdown(text, unsafe_allow_html=True)

with col4:
    st.header('')
    text = '<span style="color:gray;">Annualized total revenue:</span><br><span style="color:black;">{}</span>'.format("${:,.2f}".format(annualize_value(df['Daily Total Revenue'])))
    st.markdown(text, unsafe_allow_html=True)
    text = '<span style="color:gray;">Annualized protocol revenue:</span><br><span style="color:black;">{}</span>'.format("${:,.2f}".format(annualize_value(df['Daily Protocol Revenue'])))
    st.markdown(text, unsafe_allow_html=True)

with col5:
    st.header('')
    text = '<span style="color:gray;">P/S Ratio:</span><br><span style="color:black;">{}</span>'.format("{:,.2f}".format(revenue_df.iloc[-1]['P/S Ratio']))
    st.markdown(text, unsafe_allow_html=True)
    text = '<span style="color:gray;">P/E Ratio:</span><br><span style="color:black;">{}</span>'.format("{:,.2f}".format(revenue_df.iloc[-1]['P/E Ratio']))
    st.markdown(text, unsafe_allow_html=True)

with col6:
    st.header('')
    text = '<span style="color:gray;">Annualized borrowing volume:</span><br><span style="color:black;">{}</span>'.format("${:,.2f}".format(annualize_value(df['Daily Borrows USD'])))
    st.markdown(text, unsafe_allow_html=True)
    text = '<span style="color:gray;">Total value locked:</span><br><span style="color:black;">{}</span>'.format(market_data['tvl'])
    st.markdown(text, unsafe_allow_html=True)

st.header('Key Metrics')

with st.container():
    tvl = build_financial_chart(df, 'Total Value Locked')
    rev = build_financial_chart(df, 'Daily Total Revenue')
    dai_supply = build_financial_chart(df, 'Dai Supply')

    st.altair_chart(tvl | rev | dai_supply, use_container_width=False)

col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("Top 10 Markets by TVL")
    top_10_markets = build_pie_chart(top_10, "Total Value Locked", "Market")
    st.altair_chart(top_10_markets, use_container_width=False)

with col2:
    st.subheader("TVL by Asset")
    tvl_per_asset = build_tvl_per_asset_pie(assets_df)
    st.altair_chart(tvl_per_asset, use_container_width=False)

with col3:
    st.subheader("DAI Collateral Split")
    stable_ratio_df = get_stable_ratio(assets_df)
    stable_ratio_pie = alt.Chart(stable_ratio_df).mark_arc(innerRadius=50).encode(
        theta=alt.Theta(field="ratio", type="quantitative"),
        color=alt.Color(field="Collateral Type", type="nominal"),
        tooltip=[alt.Tooltip("ratio")],
    )
    st.altair_chart(stable_ratio_pie, use_container_width=False)


st.header('Financial Statement')

statement_df = get_financial_statement_df(df)
st.table(data=statement_df[:10])


st.header('Financial Metrics')

col1, col2, col3 = st.columns(3)

with col1:
    protocol_rev = build_multi_line_rev_chart(revenue_df)
    st.altair_chart(protocol_rev, use_container_width=False)

with col2:
    ps_ratio = build_financial_chart(revenue_df, 'P/S Ratio', y_axis_format=None)
    st.altair_chart(ps_ratio, use_container_width=False)

with col3:
    pe_ratio = build_financial_chart(revenue_df, 'P/E Ratio', y_axis_format=None)
    st.altair_chart(pe_ratio, use_container_width=False)

col_ratio = build_financial_chart(revenue_df, 'Collateralization Ratio','Dai Collateralization Ratio', y_axis_format=None)
st.altair_chart(col_ratio, use_container_width=False)


st.header('Usage Metrics')

with st.container():
    active = build_financial_chart(usage_df, 'Daily Active Users', y_axis_format=None)
    new = build_financial_chart(usage_df, 'Cumulative New Users', y_axis_format=None)

    st.altair_chart(active | new, use_container_width=False)


st.header('Live Transactions')

col1, col2 = st.columns(2)

with col1:
    st.subheader('Deposits')
    deposits_df = get_events_df(makerdao)
    st.dataframe(data=deposits_df)

with col2:
    st.subheader('Withdrawals')
    withdrawals_df = get_events_df(makerdao, 'Withdraw')
    st.dataframe(withdrawals_df)