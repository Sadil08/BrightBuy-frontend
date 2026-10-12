// Three roles, three faces. All load through next/font (self-hosted at build time, no runtime
// request to Google, no layout shift). CSS reads them through --f-display / --f-body / --f-data
// (see globals.css).
import { Fraunces, Instrument_Sans, DM_Mono } from "next/font/google";

// Display: a warm, soft-edged serif with a little personality. Headlines and prices only.
const display = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--f-display",
  display: "swap",
});

// Body: a clean humanist sans that stays readable at small sizes in forms and tables.
const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--f-body",
  display: "swap",
});

// Data: SKUs, order numbers, stock counts.
const data = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--f-data",
  display: "swap",
});

export const fontVariables = `${display.variable} ${body.variable} ${data.variable}`;
