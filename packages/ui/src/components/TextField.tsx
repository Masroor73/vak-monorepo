import { useState } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";

interface TextFieldProps extends TextInputProps {
  label?: string;
  errorText?: string;
  rightElement?: React.ReactNode;
  variant?: "light" | "dark";
}

export const TextField = ({
  label,
  placeholder,
  errorText,
  secureTextEntry = false,
  value,
  onChangeText,
  onFocus,
  onBlur,
  rightElement,
  variant = "light",
  ...props
}: TextFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const colors = {
    light: {
      text: "text-black",
      border: isFocused ? "border-black" : "border-gray-300",
      placeholder: "rgba(0,0,0,0.35)",
      label: errorText ? "text-red-500" : "text-black",
      borderRadius: "rounded-[30px]",
      paddingY: "py-3",
    },
    dark: {
      text: "text-white",
      border: errorText
        ? "border-red-500"
        : isFocused
          ? "border-auth-accent"
          : "border-white",
      placeholder: "white",
      label: errorText ? "text-red-500" : "text-white",
      borderRadius: "rounded-[15px]",
      paddingY: "py-1",
    },
  };

  const style = colors[variant];

  return (
    <View className="w-[90%] mb-4 self-center">
      {label && <Text className={`mb-1 text-sm ${style.label}`}>{label}</Text>}

      <View
        className={`flex-row items-center border ${style.border} ${style.borderRadius} px-3 ${style.paddingY}`}
      >
        <TextInput
          className={`flex-1 text-base ${style.text}`}
          placeholder={placeholder}
          placeholderTextColor={style.placeholder}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }} 
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          {...props}
        />

        {rightElement && <View className="ml-2">{rightElement}</View>}
      </View>

      {errorText && <Text className="text-red-500 text-sm mt-1">{errorText}</Text>}
    </View>
  );
};