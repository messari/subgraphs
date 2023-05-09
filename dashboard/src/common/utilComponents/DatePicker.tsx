import { Box, Button, TextField } from "@mui/material";
import { LocalizationProvider, PickersDay, StaticDatePicker } from "@mui/lab";
import MomentAdapter from "@material-ui/pickers/adapter/moment";
import { Moment } from "moment";

interface DatePickerProps {
  dates: Moment[];
  setDates: any;
}

export const DatePicker = ({ dates, setDates }: DatePickerProps) => {
  const datesValue: any = dates;
  return (
    <Box position="absolute" zIndex={2} top={30} right={320} border="1px solid white">
      <LocalizationProvider dateAdapter={MomentAdapter}>
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          onChange={(newVal: Moment | null) => {
            if (newVal) {
              setDates((prev: Moment[]) => [...prev, newVal].sort((a, b) => (a.isBefore(b) ? -1 : 1)));
            }
          }}
          value={datesValue}
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
  );
};
