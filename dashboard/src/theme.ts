import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "rgb(102,86,248)",
    },
    secondary: {
      main: "rgb(90,74,245)",
    },
    success: {
      main: "#58BC82",
    },
    error: {
      main: "#B8301C",
    },
    warning: {
      main: "#EFCB68",
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
