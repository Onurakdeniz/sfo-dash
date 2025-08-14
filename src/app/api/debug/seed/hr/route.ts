import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modules, moduleResources } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

// Development-only seed endpoint to create the HR module and its Employee Profiles submodule/resources
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    // 1) Ensure HR module exists
    const moduleCode = "hr";
    const moduleDisplayName = "Personel Yönetimi";
    const moduleName = "Human Resources Management";
    const moduleDescription =
      "İK süreçlerini dijitalleştirerek verimliliği artıran, manuel iş yükünü azaltan ve yasal uyumluluğu destekleyen merkezî modül.";

    const existingModule = await db
      .select()
      .from(modules)
      .where(and(eq(modules.code, moduleCode), isNull(modules.deletedAt)))
      .limit(1);

    const hrModule =
      existingModule[0] ||
      (
        await db
          .insert(modules)
          .values({
            id: randomUUID(),
            code: moduleCode,
            name: moduleName,
            displayName: moduleDisplayName,
            description: moduleDescription,
            icon: "users",
            color: "#3B82F6",
            isCore: false,
            sortOrder: 260,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0];

    // 2) Ensure submodule: Employee Profiles
    const submoduleCode = "employee_profiles";
    const submoduleDisplayName = "Personel Profilleri";
    const submoduleName = "Employee Profiles";
    const submoduleDescription =
      "Çalışanların kişisel, iletişim ve istihdam bilgileri ile belge yönetiminin tutulduğu dijital kimlik kartı.";

    const existingSubmodule = await db
      .select()
      .from(moduleResources)
      .where(
        and(
          eq(moduleResources.moduleId, hrModule.id),
          eq(moduleResources.code, submoduleCode),
          isNull(moduleResources.deletedAt)
        )
      )
      .limit(1);

    const submodule =
      existingSubmodule[0] ||
      (
        await db
          .insert(moduleResources)
          .values({
            id: randomUUID(),
            moduleId: hrModule.id,
            code: submoduleCode,
            name: submoduleName,
            displayName: submoduleDisplayName,
            description: submoduleDescription,
            resourceType: "submodule",
            path: null,
            parentResourceId: null,
            isActive: true,
            isPublic: false,
            requiresApproval: false,
            sortOrder: 10,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0];

    // 3) Ensure page for Employee Profiles exists
    const pageResourceCode = "employee_profiles.page";
    const existingPage = await db
      .select()
      .from(moduleResources)
      .where(
        and(
          eq(moduleResources.moduleId, hrModule.id),
          eq(moduleResources.code, pageResourceCode),
          isNull(moduleResources.deletedAt)
        )
      )
      .limit(1);

    const pageResource =
      existingPage[0] ||
      (
        await db
          .insert(moduleResources)
          .values({
            id: randomUUID(),
            moduleId: hrModule.id,
            code: pageResourceCode,
            name: "Employee Profiles Page",
            displayName: "Personel Profilleri Sayfası",
            description: "Personel profillerini listeleme ve yönetme sayfası.",
            resourceType: "page",
            path: "/:workspaceSlug/:companySlug/hr/employees",
            parentResourceId: submodule.id,
            isActive: true,
            isPublic: false,
            requiresApproval: false,
            sortOrder: 11,
            metadata: {
              component: "EmployeeProfilesPage",
              allowedActions: ["view", "create", "edit", "delete"]
            },
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0];

    // 4) Ensure feature resources under the submodule exist
    const featureDefs = [
      {
        code: "employee_profiles.personal_info",
        name: "Personal Info",
        displayName: "Kişisel Bilgiler",
        description:
          "Ad, soyad, T.C. kimlik numarası, doğum tarihi, cinsiyet gibi temel demografik veriler.",
        sortOrder: 20
      },
      {
        code: "employee_profiles.contact_info",
        name: "Contact Info",
        displayName: "İletişim Bilgileri",
        description:
          "Adres, telefon, acil durumda ulaşılacak kişi bilgileri.",
        sortOrder: 21
      },
      {
        code: "employee_profiles.employment_info",
        name: "Employment Info",
        displayName: "İstihdam Bilgileri",
        description:
          "Pozisyon, departman, işe başlangıç tarihi, yönetici bilgisi, çalışma türü.",
        sortOrder: 22
      },
      {
        code: "employee_profiles.document_management",
        name: "Document Management",
        displayName: "Personel Belge Yönetimi",
        description:
          "İş sözleşmesi, kimlik fotokopisi, diploma gibi belgelerin güvenli saklanması.",
        sortOrder: 23
      },
      {
        code: "employee_profiles.self_service",
        name: "Self Service",
        displayName: "Self-Servis",
        description:
          "Çalışanların kendi profil bilgilerini güncellemesi ve onay sürecine iletilmesi.",
        sortOrder: 24
      }
    ];

    const createdFeatures: any[] = [];
    for (const feat of featureDefs) {
      const existing = await db
        .select()
        .from(moduleResources)
        .where(
          and(
            eq(moduleResources.moduleId, hrModule.id),
            eq(moduleResources.code, feat.code),
            isNull(moduleResources.deletedAt)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        const inserted = await db
          .insert(moduleResources)
          .values({
            id: randomUUID(),
            moduleId: hrModule.id,
            code: feat.code,
            name: feat.name,
            displayName: feat.displayName,
            description: feat.description,
            resourceType: "feature",
            path: null,
            parentResourceId: submodule.id,
            isActive: true,
            isPublic: false,
            requiresApproval: false,
            sortOrder: feat.sortOrder,
            metadata: {
              allowedActions: ["view", "create", "edit", "delete"]
            },
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        createdFeatures.push(inserted[0]);
      }
    }

    return NextResponse.json(
      {
        message: "HR module seed completed",
        module: { id: hrModule.id, code: hrModule.code, displayName: hrModule.displayName },
        submodule: { id: submodule.id, code: submodule.code, displayName: submodule.displayName },
        page: { id: pageResource.id, code: pageResource.code },
        createdFeaturesCount: createdFeatures.length
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error seeding HR module:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}


