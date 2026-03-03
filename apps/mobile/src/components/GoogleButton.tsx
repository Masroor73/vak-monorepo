import { Pressable, View, Text } from "react-native";
import Google from "../../assets/Google.svg";

interface GoogleButtonProps {
  onPress?: () => void;
  style?: object;
  text?: string;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onPress,
  style = {},
  text = "Continue with Google",
}) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center self-center border border-white/70 rounded-xl h-[52px] w-[200px] bg-brand-secondary/70"
      style={style}
    >
      <View className="mr-3 w-5 h-5 items-center justify-center">
        <Google width={20} height={20} />
      </View>
      <Text className="text-white font-semibold">{text}</Text>
    </Pressable>
  );
};