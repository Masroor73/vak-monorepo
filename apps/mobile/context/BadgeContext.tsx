import { createContext, useContext } from "react";

type BadgeContextType = {
  clearTasksBadge: () => void;
  clearRecognitionBadge: () => void;
};

export const BadgeContext = createContext<BadgeContextType>({
  clearTasksBadge: () => {},
  clearRecognitionBadge: () => {},
});

export const useBadges = () => useContext(BadgeContext);