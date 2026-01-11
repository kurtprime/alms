export function getInitials(name: string) {
  if (!name || typeof name !== "string") return "";

  return name
    .trim()
    .split(" ")
    .filter((word) => /[a-zA-Z]/.test(word.charAt(0)))
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function formatQuizType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
