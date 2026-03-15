import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { supabase } from "../../lib/supabase"

export default function AvailabilityForm() {

  const [day, setDay] = useState("1")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")

  async function saveAvailability() {

    const { data: user } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("availabilities")
      .insert([
        {
          user_id: user.user?.id,
          day_of_week: Number(day),
          start_time: startTime,
          end_time: endTime,
          is_available: true
        }
      ])

    if (error) {
      alert(error.message)
    } else {
      alert("Availability saved!")
    }
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Set Availability</Text>

      <TextInput
        style={styles.input}
        placeholder="Day (1-7)"
        value={day}
        onChangeText={setDay}
      />

      <TextInput
        style={styles.input}
        placeholder="Start Time (09:00)"
        value={startTime}
        onChangeText={setStartTime}
      />

      <TextInput
        style={styles.input}
        placeholder="End Time (17:00)"
        value={endTime}
        onChangeText={setEndTime}
      />

      <TouchableOpacity style={styles.button} onPress={saveAvailability}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, marginBottom: 20 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 6
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 6
  },
  buttonText: {
    color: "white",
    textAlign: "center"
  }
})