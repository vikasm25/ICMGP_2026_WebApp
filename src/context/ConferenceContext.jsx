import { ConferenceContext } from "./context";

export function ConferenceProvider({ value, children }) {
  return <ConferenceContext.Provider value={value}>{children}</ConferenceContext.Provider>;
}
