import { createRoot } from "react-dom/client";

const el = document.getElementById("root");
if (!el) {
  // This renders a visible error if #root is missing (helps during debug)
  const msg = document.createElement("pre");
  msg.textContent = "[PBJ] #root not found in index.html";
  msg.style.whiteSpace = "pre-wrap";
  msg.style.color = "#b00";
  document.body.appendChild(msg);
} else {
  // Lazy import App so path errors in App are surfaced clearly
  createRoot(el).render(<div>Booting…</div>);
  import("./App")
    .then(({ default: App }) => {
      createRoot(el).render(<App />);
    })
    .catch((e) => {
      const msg = document.createElement("pre");
      msg.textContent = `Failed to load App:\n${String(e)}`;
      msg.style.whiteSpace = "pre-wrap";
      msg.style.color = "#b00";
      el.replaceWith(msg);
    });
}
