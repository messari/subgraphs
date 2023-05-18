import { Box, Button, TextField } from "@mui/material";
import { LocalizationProvider, PickersDay, StaticDatePicker } from "@mui/lab";
import MomentAdapter from "@material-ui/pickers/adapter/moment";
import { Moment, utc } from "moment";

interface DateRangePickerProps {
  dates: any;
  setDates: any;
}

export const DateRangePicker = ({ dates, setDates }: DateRangePickerProps) => {
  return (
    <Box position="absolute" zIndex={1000} top={30} left={5} border="1px solid white" style={{ width: "320px" }}>
      <LocalizationProvider dateAdapter={MomentAdapter}>
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          onChange={(newVal: Moment | null) => {
            if (newVal) {
              if (newVal.isBefore(utc(new Date()))) {
                if (dates.length <= 1) {
                  const arrToSet = [...dates, newVal].sort((a, b) => (a.isBefore(b) ? -1 : 1));
                  setDates(arrToSet);
                } else {
                  setDates([newVal]);
                }
              }
            }
          }}
          value={dates}
          renderDay={(day, _selectedDates, pickersDayProps) => {
            return (
              <div key={day.format("l")}>
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
          <Button key={date.format()} sx={{ border: "1px solid black" }}>
            {date.format("M/D/YY")} 𝘅
          </Button>
        ))}
      </Box>
    </Box>
  );
};
