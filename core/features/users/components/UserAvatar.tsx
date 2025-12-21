import { ComponentProps } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@core/components/ui/avatar";

export function UserAvatar({
  user,
  ...props
}: {
  user: { name: string; image: string | null };
} & ComponentProps<typeof Avatar>) {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <Avatar {...props}>
      {user.image && <AvatarImage src={user.image} alt={user.name} />}
      <AvatarFallback className="uppercase">{initials}</AvatarFallback>
    </Avatar>
  );
}
