export const isStudentEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().endsWith('.edu.vn') || email.toLowerCase().endsWith('.edu');
};
