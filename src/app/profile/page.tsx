import { redirect } from "next/navigation";

import { getMe } from "@/actions/user";
import { updateUser } from "@/actions/user/update";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const me = await getMe();

  if (me === null) {
    // Not authenticated – send to sign-in page.
    redirect("/signin");
  }

  if (!me) {
    // Should never happen, but provides type-safety.
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      {/* Using a native form that posts to the server action. */}
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

        <Button type="submit" className="w-fit">
          Save Changes
        </Button>
      </form>
    </div>
  );
}