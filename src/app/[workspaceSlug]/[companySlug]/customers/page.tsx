import { redirect } from "next/navigation";

interface PageProps {
  params: {
    workspaceSlug: string;
    companySlug: string;
  };
}

export default function CustomersRedirectPage({ params }: PageProps) {
  // Redirect to business entities page with customer filter
  redirect(`/${params.workspaceSlug}/${params.companySlug}/business-entities?type=customer`);
}
