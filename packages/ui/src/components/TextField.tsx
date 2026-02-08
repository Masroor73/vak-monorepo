import { useState } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";

interface TextFieldProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  errorText?: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

export const TextField = ({
  label,
  placeholder,
  errorText,
  secureTextEntry = false,
  value,
  onChangeText,
  ...props
}: TextFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-[85%] mb-4 self-center">
      {/* Label */}
      {label && (
        <Text className={`mb-1 text-sm ${errorText ? "text-red-500" : "text-black"}`}> {label} </Text>
      )}

      {/* Text Input */}
      <TextInput
        className={`border rounded-[20px] px-3 py-3 text-base text-black ${errorText ? "border-red-500" : "border-black"}`}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {/* Error Text */}
      {errorText && <Text className="text-red-500 text-sm mt-1">{errorText}</Text>}
    </View>
  );
};

