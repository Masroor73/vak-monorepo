import { useState } from "react";
import { View, Text, Alert } from 'react-native';
import { ShiftStatusCard, PrimaryButton, TextField } from '@vak/ui'; 

export default function Index() {
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <View className="flex-1 justify-center items-center bg-damascus-background">
      <Text className="text-2xl font-bold text-damascus-primary mb-8">
        V.A.K Mobile
      </Text>
      
      {/* Testing the Shared Component */}
      <ShiftStatusCard 
        title="Dinner Rush" 
        subtitle="Feb 2, 5:00 PM - 11:00 PM" 
        status="approved" 
      />
      
      <ShiftStatusCard 
        title="Prep Shift" 
        subtitle="Feb 3, 9:00 AM - 2:00 PM" 
        status="pending" 
      />

      {/* TextFields for testing */}
      <TextField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        errorText={email === "" ? "Email is required" : ""}
      />

      <TextField
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

       {/* PrimaryButton for testing */}
      <PrimaryButton
        title="Confirm Shift"
        variant="primary"
        onPress={() => Alert.alert("Primary Button Pressed")}
        isLoading={false}
      />
    </View>
  );
}