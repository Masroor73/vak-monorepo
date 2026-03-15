import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { supabase } from "../../lib/supabase"

export default function RecognitionForm() {

  const [receiverId, setReceiverId] = useState("")
  const [message, setMessage] = useState("")

  async function sendRecognition() {

    const { data: user } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("recognitions")
      .insert([
        {
          sender_id: user.user?.id,
          receiver_id: receiverId,
          message: message,
          badge_icon: "star"
        }
      ])

    if (error) {
      alert(error.message)
    } else {
      alert("Recognition sent!")
      setMessage("")
    }
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Send Recognition</Text>

      <TextInput
        style={styles.input}
        placeholder="Receiver ID"
        value={receiverId}
        onChangeText={setReceiverId}
      />

      <TextInput
        style={styles.input}
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity style={styles.button} onPress={sendRecognition}>
        <Text style={styles.buttonText}>Send</Text>
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
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 6
  },
  buttonText: {
    color: "white",
    textAlign: "center"
  }
})