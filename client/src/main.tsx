import { createRoot } from "react-dom/client";

const el = document.getElementById("root");
if (!el) {
  const msg = document.createElement("pre");
  msg.textContent = "[PBJ] #root not found in index.html";
  msg.style.whiteSpace = "pre-wrap";
  msg.style.color = "#b00";
  document.body.appendChild(msg);
} else {
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
