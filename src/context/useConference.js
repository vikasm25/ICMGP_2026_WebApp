import { useContext } from "react";
import { ConferenceContext } from "./context";

export function useConference() {
  const value = useContext(ConferenceContext);
  if (!value) throw new Error("useConference must be used inside ConferenceProvider");
  return value;
}
