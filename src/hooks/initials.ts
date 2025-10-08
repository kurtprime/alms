export function getInitials(name: string) {
  if (!name || typeof name !== "string") return "";

  return name
    .trim()
    .split(" ")
    .filter((word) => /[a-zA-Z]/.test(word.charAt(0)))
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
