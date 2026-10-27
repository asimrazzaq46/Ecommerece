import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
const Context = createContext({ success() {}, error() {} });
export const useAlert = () => useContext(Context);
export function AlertProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const timers = useRef(new Set());
  const nextId = useRef(0);
  const dismiss = useCallback(
    (id) =>
      setMessages((current) => current.filter((message) => message.id !== id)),
    [],
  );
  const show = useCallback(
    (type, text) => {
      const id = ++nextId.current;
      setMessages((current) => [...current, { id, type, text: String(text) }]);
      const timer = setTimeout(() => {
        dismiss(id);
        timers.current.delete(timer);
      }, 5000);
      timers.current.add(timer);
    },
    [dismiss],
  );
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const value = useMemo(
    () => ({
      success: (text) => show("success", text),
      error: (text) => show("danger", text),
    }),
    [show],
  );
  return (
    <Context.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 2000,
          maxWidth: "90vw",
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            role={message.type === "danger" ? "alert" : "status"}
            className={`alert alert-${message.type}`}
          >
            {message.text}{" "}
            <button
              type="button"
              className="close ml-3"
              aria-label="Dismiss notification"
              onClick={() => dismiss(message.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}
