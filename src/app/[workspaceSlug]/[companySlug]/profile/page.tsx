import { redirect } from "next/navigation";
import { format } from "date-fns";

import { getMe } from "@/actions/user";
import { updateUser } from "@/actions/user/update";
import { db } from "@/db";
import { workspace, workspaceCompany, workspaceMember } from "@/db/schema";
import { eq } from "drizzle-orm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProfileWrapper } from "./profile-wrapper";

export default async function WorkspaceProfilePage() {
  // ----------------------------------
  // Fetch current user (server side)
  // ----------------------------------
  const me = await getMe();

  if (me === null) {
    redirect("/signin");
  }

  if (!me) {
    return null;
  }

  // ----------------------------------
  // Aggregate workspace / company stats
  // ----------------------------------
  const userWorkspaces = await db
    .select({ id: workspace.id })
    .from(workspace)
    .where(eq(workspace.ownerId, me.id));

  const companiesCounts = await Promise.all(
    userWorkspaces.map(async (w) => {
      const companies = await db
        .select({ companyId: workspaceCompany.companyId })
        .from(workspaceCompany)
        .where(eq(workspaceCompany.workspaceId, w.id));
      return companies.length;
    })
  );
  const totalCompanies = companiesCounts.reduce((acc, curr) => acc + curr, 0);

  const invitationsSent = await db
    .select({ workspaceId: workspaceMember.workspaceId })
    .from(workspaceMember)
    .where(eq(workspaceMember.invitedBy, me.id));

  const accountCreatedAt = format(
    new Date(me.createdAt ?? new Date()),
    "PP"
  );

  return (
    <ProfileWrapper>
      <Card className="w-full bg-white border-gray-100">
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left column – editable form */}
            <form action={updateUser} className="grid gap-6">
              <div className="grid gap-2">
                <label htmlFor="name" className="font-medium">
                  Name
                </label>
                <Input id="name" name="name" defaultValue={me.name ?? ""} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="username" className="font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  defaultValue={(me as any).username ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="displayUsername" className="font-medium">
                  Display Username
                </label>
                <Input
                  id="displayUsername"
                  name="displayUsername"
                  defaultValue={(me as any).displayUsername ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="image" className="font-medium">
                  Image URL
                </label>
                <Input id="image" name="image" defaultValue={me.image ?? ""} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="font-medium">
                  Email
                </label>
                <Input id="email" defaultValue={me.email ?? ""} disabled />
              </div>

              <Button type="submit" className="w-fit mt-2">
                Save Changes
              </Button>
            </form>

            {/* Right column – informational stats */}
            <div className="grid gap-6">
              <div className="grid gap-2">
                <span className="font-medium">Owned Workspaces</span>
                <p>{userWorkspaces.length}</p>
              </div>
              <div className="grid gap-2">
                <span className="font-medium">Companies</span>
                <p>{totalCompanies}</p>
              </div>
              <div className="grid gap-2">
                <span className="font-medium">Invitations Sent</span>
                <p>{invitationsSent.length}</p>
              </div>
              <div className="grid gap-2">
                <span className="font-medium">Account Created</span>
                <p>{accountCreatedAt}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ProfileWrapper>
  );
}
