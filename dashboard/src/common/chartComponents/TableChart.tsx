import { LocalizationProvider, PickersDay, StaticDatePicker } from "@mui/lab";
import MomentAdapter from "@material-ui/pickers/adapter/moment";
import { Box, Button, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState } from "react";
import { toDate } from "../../../src/utils/index";
import { percentageFieldList } from "../../constants";
import moment, { Moment } from "moment";

interface TableChartProps {
  datasetLabel: string;
  dataTable: any;
}

export const TableChart = ({ datasetLabel, dataTable }: TableChartProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dates, setDates] = useState<any>([]);

  const isPercentageField = percentageFieldList.find((x) => {
    return datasetLabel.toUpperCase().includes(x.toUpperCase());
  });
  if (dataTable) {
    const columns = [
      { field: "date", headerName: "Date", width: 120 },
      {
        field: "value",
        headerName: "Value",
        flex: 1,
      },
    ];
    let suffix = "";
    if (isPercentageField) {
      suffix = "%";
    }
    const hourly = datasetLabel.toUpperCase().includes("HOURLY");

    const filteredData = dataTable.filter((val: any) =>
      dates.length
        ? dates.map((date: Moment) => date.format("l")).includes(moment.unix(val.date).utc().format("l"))
        : true,
    );
    const tableData = filteredData.map((val: any, i: any) => {
      let returnVal = val.value.toLocaleString() + suffix;
      if (isPercentageField && Array.isArray(val.value)) {
        returnVal = val.value.map((ele: string) => ele.toLocaleString() + "%").join(", ");
      }
      return {
        id: i,
        date: toDate(val.date, hourly),
        value: returnVal,
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

          <Button onClick={() => setShowDatePicker((prev) => !prev)}>
            {showDatePicker ? "Hide" : "Show"} Date Filter
          </Button>
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
