export const separateFullName = (fullName: string) => {
  const names = fullName.split(",");

  return names.reverse();
};
