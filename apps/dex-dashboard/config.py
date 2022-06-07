from utils import *
from pyecharts import options as opts

SUBGRAPH_API_URL = {
    'Balancer v2 (Ethereum)': "https://api.thegraph.com/subgraphs/name/messari/balancer-v2-ethereum", 
    'Curve (Ethereum)': "https://api.thegraph.com/subgraphs/name/messari/curve-finance-ethereum", 
    'Saddle Finance (Ethereum)': "https://api.thegraph.com/subgraphs/name/messari/saddle-finance-ethereum",
    'Sushiswap (Ethereum)': "https://api.thegraph.com/subgraphs/name/messari/sushiswap-ethereum", 
    'Sushiswap (Avax)': "https://api.thegraph.com/subgraphs/name/messari/sushiswap-avalanche",
    'Uniswap v3 (Ethereum)': "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-ethereum"
}

DEFAULT_TITLE_OPTS = opts.TitleOpts(
    padding=10,
    item_gap=0,
    pos_left="10",
    pos_right="0",
    pos_top="10",
    pos_bottom="0",
    title_textstyle_opts=opts.TextStyleOpts(
        color="white",
    )
)

DEFAULT_LEGEND_OPTS = opts.LegendOpts(
    is_show=True,
    type_="scroll", 
    pos_left="55%", 
    pos_top = "20%",
    orient="vertical",
    textstyle_opts=opts.TextStyleOpts(
        color='#FFFFFF'
    )
)

DEFAULT_TOOLTIP_OPTS = opts.TooltipOpts(
    is_show=True,
    padding=12,
    trigger="axis",
    axis_pointer_type="line",
    background_color="#3C2E48",
    textstyle_opts=opts.TextStyleOpts(color="#FFFFFF", font_size=14),
)

DEFAULT_TOOLBOX_OPTS = opts.ToolboxOpts(
    is_show=True,
    pos_left="82%",
    feature=opts.ToolBoxFeatureOpts(
        save_as_image=opts.ToolBoxFeatureSaveAsImageOpts(
            is_show=True, title="Save"
        ),
        restore=opts.ToolBoxFeatureRestoreOpts(
            is_show=True, title="Refresh"
        ),
        data_view=opts.ToolBoxFeatureDataViewOpts(
            is_show=False
        ),
        data_zoom=opts.ToolBoxFeatureDataZoomOpts(
            is_show=False
        ),
        magic_type=opts.ToolBoxFeatureMagicTypeOpts(
            is_show=True,
            line_title="Line",
            bar_title="Bar",
            stack_title="Stack",
            tiled_title="Tiled",
        ),
        brush=opts.ToolBoxFeatureBrushOpts(type_=False),
    )
)

DEFAULT_XAXIS_OPTS = opts.AxisOpts(
    type_="category",
    is_show=True,
    name_location="start",
    min_interval=5,
    axislabel_opts=opts.LabelOpts(
        is_show=True,
        formatter=xaxis_label_formatter()
    )
)

DEFAULT_YAXIS_OPTS = opts.AxisOpts(
    is_show=True,
    type_="value",
    name_location="middle",
    offset=5,
    split_number=5,
    name_textstyle_opts=opts.TextStyleOpts(
        font_size=15,
    ),
    axistick_opts=opts.AxisTickOpts(is_show=True),
    axisline_opts=opts.AxisLineOpts(
        is_show=True,
        is_on_zero=False,
        on_zero_axis_index=0,
        symbol=None,
        linestyle_opts=opts.LineStyleOpts(
            is_show=True,
            width=1,
            opacity=1,
            curve=0,
            type_="dash",
            color=None,
        ),
    ),
    axislabel_opts=opts.LabelOpts(
        formatter=yaxis_label_formatter()
    ),
    axispointer_opts=opts.AxisPointerOpts(),
    splitline_opts=opts.SplitLineOpts(
        is_show=True,
        linestyle_opts=opts.LineStyleOpts(
            type_="dashed", opacity=0.2, color="#FFFFFF"
        ),
    ),
    splitarea_opts=opts.SplitAreaOpts(),
    minor_tick_opts=opts.MinorTickOpts(),
    minor_split_line_opts=opts.MinorSplitLineOpts()
)

DEFAULT_DATAZOOM_OPTS = [
    opts.DataZoomOpts(
        range_start=0, 
        range_end=100
    ),
    opts.DataZoomOpts(
        type_="inside"
    ),
]

DEFAULT_GRAPHIC_OPTS = opts.GraphicImage(
    graphic_item=opts.GraphicItem(
        id_="Messari_Logo", 
        z=-10, 
        top=70, 
        right=70, 
        bounding="raw", 
        origin=[75, 75]
    ),
    graphic_imagestyle_opts=opts.GraphicImageStyleOpts(
        image="https://messari.io/images/Messari_horizontal_white-03.svg",
        width=165,
        height=30,
        opacity=0.2,
    )
)
