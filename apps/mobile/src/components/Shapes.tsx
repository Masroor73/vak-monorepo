import { View } from "react-native";

interface ShapeProps {
  className?: string;
}

// Circle shape
export const Circle = ({ className = "" }: ShapeProps) => (
  <View className={`rounded-full absolute ${className}`} pointerEvents="none" />
);

// Ring shape (circle with border)
export const Ring = ({ className = "" }: ShapeProps) => (
  <View className={`rounded-full absolute bg-transparent border ${className}`} pointerEvents="none" />
);

// Diamond shape (square rotated 45°)
export const Diamond = ({ className = "" }: ShapeProps) => (
  <View className={`absolute rotate-45 ${className}`} pointerEvents="none" />
);