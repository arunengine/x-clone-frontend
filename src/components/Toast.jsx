import { useEffect, useState } from "react";

let toastListeners = [];
let toastId = 0;

export function showToast(message, type = "success") {
  const id = ++toastId;
  toastListeners.forEach(fn => fn({ id, message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 3000);
    };
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter(l => l !== listener); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      zIndex: 9999,
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: "600",
            fontSize: "14px",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            animation: "slideInRight 0.3s ease",
            background: toast.type === "error"
              ? "linear-gradient(135deg, #e53e3e, #c53030)"
              : toast.type === "warning"
              ? "linear-gradient(135deg, #d69e2e, #b7791f)"
              : "linear-gradient(135deg, #1d9bf0, #0f6cbd)",
          }}
        >
          {toast.type === "error" ? "❌ " : toast.type === "warning" ? "⚠️ " : "✓ "}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
