"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Shield,
  Users,
  Key,
  ArrowRight,
  Settings
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
import SystemScopeTabs from "./system-tabs";
import { RoleGuard } from "@/components/layouts/role-guard";

const systemModules = [
  {
    title: "Modüller",
    description: "Sistem modüllerini ve yapılandırmalarını yönetin",
    icon: Package,
    href: "modules",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950"
  },
  {
    title: "Roller",
    description: "Kullanıcı rollerini oluşturun ve yapılandırın",
    icon: Users,
    href: "roles",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950"
  },
  {
    title: "İzinler",
    description: "Ayrıntılı izinleri ve erişim kontrollerini yönetin",
    icon: Key,
    href: "permissions",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950"
  }
];



function SystemPageContent() {
  const router = useRouter();

  return (
    <PageWrapper
      title="Sistem Yönetimi"
      description="Sisteminiz için modülleri, kaynakları, rolleri ve izinleri yapılandırın"
      secondaryNav={<SystemScopeTabs />}
    >
      <div className="space-y-8">

      {/* Main System Modules */}
              <div>
        <h2 className="text-xl font-semibold mb-4">Temel Sistem Yönetimi</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {systemModules.map((module) => (
            <Card 
              key={module.href} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`system/${module.href}`)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                  <module.icon className={`w-6 h-6 ${module.color}`} />
              </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Yönet
                  <ArrowRight className="w-4 h-4" />
                </Button>
            </CardContent>
          </Card>
          ))}
        </div>
      </div>




      </div>
    </PageWrapper>
  );
}

export default function SystemPage() {
  return (
    <RoleGuard 
      requiredRoles={['owner', 'admin']}
      fallbackMessage="Sistem yönetimi sayfasına erişmek için yönetici yetkisi gereklidir."
    >
      <SystemPageContent />
    </RoleGuard>
  );
}