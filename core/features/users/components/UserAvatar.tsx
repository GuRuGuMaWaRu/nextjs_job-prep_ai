import type { UserResource } from "@clerk/types";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@core/components/ui/avatar";

export default function UserAvatar({
  user,
}: {
  user: UserResource | null | undefined;
}) {
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
    : "?";

  return (
    <Avatar>
      <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
      <AvatarFallback className="uppercase">{initials}</AvatarFallback>
    </Avatar>
  );
}
