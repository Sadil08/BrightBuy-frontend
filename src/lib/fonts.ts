// Three roles, three faces. All load through next/font (self-hosted at build time, no runtime
// request to Google, no layout shift). CSS reads them through --f-display / --f-body / --f-data
// (see globals.css).
import { Bricolage_Grotesque, Instrument_Sans, DM_Mono } from "next/font/google";

// Display: characterful, slightly quirky grotesque with real weight range. Headlines and prices only.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
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
