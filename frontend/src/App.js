import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Timeline from "@/pages/Timeline";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/timeline" element={<Timeline />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0F0F0F",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#EDEDED",
          },
        }}
      />
    </div>
  );
}

export default App;
