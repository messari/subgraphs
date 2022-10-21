import { LocalizationProvider, PickersDay, StaticDatePicker } from "@mui/lab";
import MomentAdapter from "@material-ui/pickers/adapter/moment";
import { Box, Button, TextField } from "@mui/material";
import { DataGrid, GridAlignment } from "@mui/x-data-grid";
import { useState } from "react";
import { downloadCSV, toDate, toUnitsSinceEpoch } from "../../../src/utils/index";
import { percentageFieldList } from "../../constants";
import moment, { Moment } from "moment";

interface TableChartProps {
  datasetLabel: string;
  dataTable: any;
  jpegDownloadHandler: any;
}

export const TableChart = ({ datasetLabel, dataTable, jpegDownloadHandler }: TableChartProps) => {
  const field = datasetLabel.split("-")[1] || datasetLabel;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDateString, toggleDateString] = useState(true);
  const [dates, setDates] = useState<any>([]);

  const isPercentageField = percentageFieldList.find((x) => {
    return datasetLabel.toUpperCase().includes(x.toUpperCase());
  });
  const hourly = datasetLabel.toUpperCase().includes("HOURLY");
  if (dataTable) {
    let xHeaderName = "Date";
    if (!showDateString) {
      if (hourly) {
        xHeaderName = "Hours";
      } else {
        xHeaderName = "Days";
      }
    }
    const columns = [
      { field: "date", headerName: xHeaderName, width: 120 },
      {
        field: "value",
        headerName: "Value",
        flex: 1,
        type: isPercentageField ? "string" : "number",
        headerAlign: "left" as GridAlignment,
        align: "left" as GridAlignment,
      },
    ];
    let suffix = "";
    if (isPercentageField) {
      suffix = "%";
    }

    const filteredData = dataTable.filter((val: any) =>
      dates.length
        ? dates.map((date: Moment) => date.format("l")).includes(moment.unix(val.date).utc().format("l"))
        : true,
    );
    const tableData = filteredData.map((val: any, i: any) => {
      let returnVal = Number(Number(val.value).toFixed(2)).toLocaleString() + suffix;
      if (isPercentageField && Array.isArray(val.value)) {
        returnVal = val.value.map((ele: string) => ele.toLocaleString() + "%").join(", ");
      }
      let dateColumn = toDate(val.date, hourly);
      if (!showDateString) {
        dateColumn = toUnitsSinceEpoch(dateColumn, hourly);
      }
      return {
        id: i,
        date: dateColumn,
        value: isNaN(Number(val.value)) || returnVal.includes('%') ? returnVal : Number(val.value),
      };
    });

    return (
      <Box sx={{ height: "100%" }}>
        <Box position="relative" sx={{ marginTop: "-38px" }}>
          {showDatePicker && (
            <Box position="absolute" zIndex={2} top={30} right={320} border="1px solid white">
              <LocalizationProvider dateAdapter={MomentAdapter}>
                <StaticDatePicker
                  displayStaticWrapperAs="desktop"
                  onChange={(newVal: Moment | null) => {
                    if (newVal) {
                      setDates((prev: Moment[]) => [...prev, newVal].sort((a, b) => (a.isBefore(b) ? -1 : 1)));
                    }
                  }}
                  value={dates}
                  renderDay={(day, _selectedDates, pickersDayProps) => {
                    return (
                      <div
                        key={day.format("l")}
                        onClick={() => {
                          if (dates.map((date: Moment) => date.format("l")).includes(day.format("l"))) {
                            setDates(dates.filter((date: Moment) => date.format("l") !== day.format("l")));
                          }
                        }}
                      >
                        <PickersDay
                          {...pickersDayProps}
                          selected={dates.map((date: Moment) => date.format("l")).includes(day.format("l"))}
                        />
                      </div>
                    );
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
              <Box display="flex" flexWrap="wrap" gap={1} sx={{ padding: 1, backgroundColor: "Window" }}>
                {dates.map((date: Moment) => (
                  <Button
                    key={date.format()}
                    sx={{ border: "1px solid black" }}
                    onClick={() => setDates(dates.filter((d: Moment) => d !== date))}
                  >
                    {date.format("M/D/YY")} 𝘅
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          <Button className="Hover-Underline" onClick={() => setShowDatePicker((prev) => !prev)}>
            Date Filter
          </Button>
          <Button className="Hover-Underline" onClick={() => toggleDateString(!showDateString)}>
            {showDateString ? `${hourly ? "hours" : "days"} since epoch` : "Date MM/DD/YYYY"}
          </Button>
          <Button className="Hover-Underline" onClick={() => downloadCSV(dataTable.sort((a: any, b: any) => (Number(a.date) - Number(b.date))).map((x: any) => ({ date: moment.utc(x.date * 1000).format("YYYY-MM-DD"), [field]: x.value })), datasetLabel + '-csv', datasetLabel)}>
            Save CSV
          </Button>
          {jpegDownloadHandler ? <Button className="Hover-Underline" onClick={() => jpegDownloadHandler()}>Save Chart</Button> : null}
        </Box>
        <DataGrid
          sx={{ textOverflow: "clip" }}
          initialState={{
            sorting: {
              sortModel: [{ field: "date", sort: "desc" }],
            },
          }}
          rows={tableData}
          columns={columns}
        />
      </Box>
    );
  }
  return null;
};
