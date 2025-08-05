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
  Settings,
  Activity,
  Database,
  Lock,
  Puzzle
} from "lucide-react";
import { PageWrapper } from "@/components/page-wrapper";
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
    title: "Kaynaklar",
    description: "Sistem kaynaklarını ve uç noktalarını tanımlayın ve yönetin",
    icon: Shield,
    href: "resources", 
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950"
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

const additionalFeatures = [
  {
    title: "Sistem İzleme",
    description: "Sistem sağlığını ve performansını izleyin",
    icon: Activity,
    disabled: true
  },
  {
    title: "Veritabanı Yönetimi",
    description: "Veritabanı işlemleri ve geçişleri",
    icon: Database,
    disabled: true
  },
  {
    title: "API Key ve Password Yönetimi",
    description: "API anahtarları ve şifre politikalarını yönetin",
    icon: Key,
    disabled: true
  },
  {
    title: "Sözleşme Yönetimi",
    description: "Organizasyon politikalarını ve sözleşmelerini yönetin",
    icon: Puzzle,
    href: "policies",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
    disabled: false
  }
];

function SystemPageContent() {
  const router = useRouter();

  return (
    <PageWrapper
      title="Sistem Yönetimi"
      description="Sisteminiz için modülleri, kaynakları, rolleri ve izinleri yapılandırın"
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

      {/* Additional Features */}
              <div>
        <h2 className="text-xl font-semibold mb-4">Ek Özellikler</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {additionalFeatures.map((feature) => (
            <Card 
              key={feature.title} 
              className={feature.disabled ? "opacity-50" : "hover:shadow-lg transition-shadow cursor-pointer"}
              onClick={() => !feature.disabled && feature.href && router.push(`system/${feature.href}`)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.disabled ? 'bg-gray-100 dark:bg-gray-900' : (feature.bgColor || 'bg-gray-100 dark:bg-gray-900')} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.disabled ? 'text-gray-500' : (feature.color || 'text-gray-500')}`} />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full" disabled={feature.disabled}>
                  {feature.disabled ? "Yakında" : "Yönet"}
                </Button>
            </CardContent>
          </Card>
          ))}
        </div>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Genel Bakış</CardTitle>
          <CardDescription>
            Sistem yapılandırmanız hakkında hızlı istatistikler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Aktif Modüller</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Toplam Kaynaklar</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Yapılandırılmış Roller</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Toplam İzinler</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </CardContent>
      </Card>
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