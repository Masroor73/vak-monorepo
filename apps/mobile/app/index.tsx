import { View, Text } from 'react-native';
import { ShiftStatusCard } from '@vak/ui'; // <--- The Moment of Truth

export default function Index() {
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
    </View>
  );
}