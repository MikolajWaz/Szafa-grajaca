import "./globals.css";

export const metadata = {
  title: "Szafa grająca – wybierz piosenkę na imprezę",
  description: "Wyszukaj utwór i zagłosuj, żeby DJ go zagrał!",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#12060f" };

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
