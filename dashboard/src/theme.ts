import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      // main: "rgba(62, 145, 227, 1)",
      main: "rgb(102,86,248)",
    },
    secondary: {
      main: "rgb(90,74,245)",
    },
    error: {
      main: "#B8301C",
    },
    warning: {
      main: "#CEDB53",
    },
  },

  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          color: "#fff",
          textDecoration: "none",
          ":hover": {
            textDecoration: "underline",
          },
        },
      },
    },
  },
});
