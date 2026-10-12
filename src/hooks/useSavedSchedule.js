import { useEffect, useState } from "react";
import { SAVED_KEY } from "../utils/constants";

export function useSavedSchedule() {
  const [savedItems, setSavedItems] = useState(() => {
    const stored = localStorage.getItem(SAVED_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ({
        ...item,
        date: item.date ? new Date(item.date) : null,
      }));
    } catch (error) {
      console.error("Could not load saved schedule:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedItems));
  }, [savedItems]);

  function isSaved(item) {
    return savedItems.some((saved) => saved.id === item.id);
  }

  function toggleSave(item) {
    if (isSaved(item)) {
      setSavedItems((current) => current.filter((saved) => saved.id !== item.id));
      return;
    }
    setSavedItems((current) => [
      ...current,
      { ...item, date: item.date ? new Date(item.date) : null },
    ]);
  }

  return { savedItems, isSaved, toggleSave };
}
