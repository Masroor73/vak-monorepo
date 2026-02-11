import { BrowserRouter, Routes, Route } from "react-router-dom";
import AnalyzeReports from "./pages/AnalyzeReports";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AnalyzeReports />} />
        <Route path="/analyze-reports" element={<AnalyzeReports />} />
      </Routes>
    </BrowserRouter>
  );
}
