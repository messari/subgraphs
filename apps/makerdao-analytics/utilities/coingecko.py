from datetime import datetime
import pandas as pd
import requests


BASE_URL = "https://api.coingecko.com/api/v3/"

def get_coin_market_chart(token_name):
    url = BASE_URL+"coins/{}/market_chart?vs_currency=usd&days=max&interval=daily".format(token_name)
    resp = requests.get(url)
    if resp.status_code == 200:
        result = resp.json()
    else:
        print('Request Error: {}: invalid token name'.format(resp.status_code))
        result = {}
    return result

def get_coin_market_cap(token_name):
    market_chart = get_coin_market_chart(token_name)
    market_caps = [{
        'Date':datetime.utcfromtimestamp(int(item[0]/1000)),
        'mcap':item[1]
        } for item in market_chart['market_caps']]
    df = pd.DataFrame(market_caps)
    return df

def get_price(token_name):
    url = 'https://api.coingecko.com/api/v3/simple/price?ids={}&vs_currencies=usd'.format(token_name)
    resp = requests.get(url)
    if resp.status_code == 200:
        result = resp.json()
        return result[token_name]['usd']
    else:
        print('Request Error: {}: invalid token name'.format(resp.status_code))
        return 0

def get_market_data(token_name):
    url = 'https://api.coingecko.com/api/v3/coins/{}?market_data=true&community_data=false&developer_data=false'.format(token_name)
    resp = requests.get(url)
    result_dict = {}
    if resp.status_code == 200:
        result = resp.json()
        result_dict['price'] = "${:,.2f}".format(result['market_data']['current_price']['usd'])
        result_dict['ath'] = "${:,.2f}".format(result['market_data']['ath']['usd'])
        result_dict['atl'] = "${:,.2f}".format(result['market_data']['atl']['usd'])
        result_dict['24hr_change'] = "{:,.2f}%".format(result['market_data']['price_change_percentage_24h'])
        result_dict['7d_change'] = "{:,.2f}%".format(result['market_data']['price_change_percentage_7d'])
        result_dict['30d_change'] = "{:,.2f}%".format(result['market_data']['price_change_percentage_30d'])
        result_dict['1y_change'] = "{:,.2f}%".format(result['market_data']['price_change_percentage_1y'])
        result_dict['circ_market_cap'] = "${:,.2f}".format(result['market_data']['circulating_supply'] * result['market_data']['current_price']['usd'])
        result_dict['fdv_market_cap'] = "${:,.2f}".format(result['market_data']['fully_diluted_valuation']['usd'])
        result_dict['tvl'] = "${:,.2f}".format(result['market_data']['total_value_locked']['usd'])
    else:
        print('Request Error: {}: invalid token name'.format(resp.status_code))
    return result_dict