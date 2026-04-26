export const getAdmissionHours = (admittedAt) => {
  if (!admittedAt) return 0;

  const now = new Date();
  const admitted = new Date(admittedAt);

  const diff = now - admitted;

  return diff / (1000 * 60 * 60); // hours
};