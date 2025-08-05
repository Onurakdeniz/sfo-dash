"use client";

import { PageWrapper } from "@/components/page-wrapper";

interface ProfileWrapperProps {
  children: React.ReactNode;
}

export function ProfileWrapper({ children }: ProfileWrapperProps) {
  return (
    <PageWrapper
      title="Profil"
      description="Kullanıcı hesabınızı ve ayarlarınızı yönetin"
    >
      {children}
    </PageWrapper>
  );
}