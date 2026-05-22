import React from "react";
import { PayContextProvider } from "@/context/PayContext";
import "./globals.css";

export const metadata = {
  title: "TaniaPay - Control de Asistencia",
  description: "Sistema interno de conciliación de nómina para Farma Tania",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <PayContextProvider>
          {children}
        </PayContextProvider>
      </body>
    </html>
  );
}