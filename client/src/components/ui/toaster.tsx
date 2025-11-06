"use client";

import * as React from "react";
import * as Toast from "@radix-ui/react-toast";

export function Toaster() {
  return (
    <Toast.Provider swipeDirection="right">
      {/* You can add <Toast.Root> instances via your own use-toast hook later */}
      <Toast.Viewport
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          width: 360,
          maxWidth: "100vw",
          zIndex: 9999
        }}
      />
    </Toast.Provider>
  );
}
