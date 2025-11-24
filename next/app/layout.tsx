import "./globals.css";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProfileProvider } from "@/hooks/useProfile";

export const metadata = {
  title: "PBJ Lyfe",
  description: "Your daily lifestyle dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
