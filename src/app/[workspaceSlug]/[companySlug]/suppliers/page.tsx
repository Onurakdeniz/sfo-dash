import { redirect } from "next/navigation";

interface PageProps {
  params: {
    workspaceSlug: string;
    companySlug: string;
  };
}

export default function SuppliersRedirectPage({ params }: PageProps) {
  // Redirect to business entities page with supplier filter
  redirect(`/${params.workspaceSlug}/${params.companySlug}/business-entities?type=supplier`);
}
