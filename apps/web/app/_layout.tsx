import { Slot } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F5F5F5' }}>
       {/* This div simulates where the Sidebar will go later */}
       <Slot />
    </div>
  );
}