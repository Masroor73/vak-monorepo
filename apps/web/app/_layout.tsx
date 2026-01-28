import { Slot } from "expo-router";
import "../global.css";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F5F5F5' }}>
        <Slot />
      </div>
    </AuthProvider>
  );
}