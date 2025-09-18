import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";

export const generateAvatar = (avatarStyle: "initials", seed: string) => {
  if (avatarStyle === "initials") {
    const avatar = createAvatar(initials, {
      seed: seed,
      radius: 50,
    });

    return avatar.toDataUri();
  }
  throw new Error("Unsupported avatar style");
};
