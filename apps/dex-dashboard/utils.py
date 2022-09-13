import pytz
import datetime
from pyecharts.types import JsCode


def format_xaxis(series: list[int], Multiplier=60 * 60 * 24, format: str = "%B %d, %Y"):
    return [
        datetime.datetime.fromtimestamp(i).astimezone(pytz.utc).strftime(format)
        for i in list(map(lambda x: int(x) * Multiplier, series))
    ]

def xaxis_label_formatter():
    return JsCode(
        """
        function Formatter(n) {
            let word = n.split(',');
            
            return word[0];
        };
        """
    )

def yaxis_label_formatter():
    return JsCode(
        """
        function Formatter(n) {
            if (n < 1e3) return n;
            if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
            if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
            if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
            if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
        };
        """
    )


