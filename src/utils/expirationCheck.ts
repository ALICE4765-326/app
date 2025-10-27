const TRIAL_DAYS = 30;

export function isExpired(userCreatedAt: string): boolean {
  const createdDate = new Date(userCreatedAt);
  const expirationDate = new Date(createdDate);
  expirationDate.setDate(expirationDate.getDate() + TRIAL_DAYS);

  const currentDate = new Date();
  return currentDate > expirationDate;
}

export function getDaysRemaining(userCreatedAt: string): number {
  const createdDate = new Date(userCreatedAt);
  const expirationDate = new Date(createdDate);
  expirationDate.setDate(expirationDate.getDate() + TRIAL_DAYS);

  const currentDate = new Date();
  const diffTime = expirationDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function getExpirationDate(userCreatedAt: string): Date {
  const createdDate = new Date(userCreatedAt);
  const expirationDate = new Date(createdDate);
  expirationDate.setDate(expirationDate.getDate() + TRIAL_DAYS);
  return expirationDate;
}
