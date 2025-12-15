export const separateFullName = (fullName: string) => {
  const names = fullName.split(",").map((name) => name.trim());

  return names.reverse();
};
