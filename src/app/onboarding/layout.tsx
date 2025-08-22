import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kurulum - Yönetim Sistemi",
  description: "Hesap kurulumunuzu tamamlayın",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-white">
      {children}
    </div>
  );
} 