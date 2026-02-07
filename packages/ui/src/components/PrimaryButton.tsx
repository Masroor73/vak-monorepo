import { Pressable, Text } from "react-native";

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  isLoading?: boolean;
  variant?: "primary" | "danger"; // optional variant, defaults to primary
}

export const PrimaryButton = ({
  title,
  onPress,
  isLoading = false,
  variant = "primary",
}: PrimaryButtonProps) => {
  const backgroundColor = variant === "danger" ? "bg-red-700" : "bg-black";

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      className={`${backgroundColor} rounded-[8px] px-6 py-3 items-center justify-center`}
    >
      <Text className="text-white font-semibold">{title}</Text>
    </Pressable>
  );
};
