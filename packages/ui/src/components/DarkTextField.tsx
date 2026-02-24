import { useState } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";

interface DarkTextFieldProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  errorText?: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  rightElement?: React.ReactNode;
}

export const DarkTextField = ({
  label,
  placeholder,
  errorText,
  secureTextEntry = false,
  value,
  onChangeText,
  rightElement,
  ...props
}: DarkTextFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-[90%] mb-4 self-center">
      {/* Label */}
      {label && (
        <Text
          className={`mb-1 text-sm ${
            errorText ? "text-red-400" : "text-white/70"
          }`}
        >
          {label}
        </Text>
      )}

      {/* Text Input + Icon Container */}
      <View
        className={`flex-row items-center border rounded-[15px] px-3 py-1 ${
          errorText
            ? "border-red-400"
            : isFocused
            ? "border-white"
            : "border-white/60"
        }`}
      >
        {/* TextInput */}
        <TextInput
          className="flex-1 text-base text-white"
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.35)"
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Right element appears inside the input box */}
        {rightElement && <View className="ml-2">{rightElement}</View>}
      </View>

      {/* Error Text */}
      {errorText && (
        <Text className="text-red-400 text-sm mt-1">{errorText}</Text>
      )}
    </View>
  );
};