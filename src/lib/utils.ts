export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

export const getSpendPercentage = (spend: number, maxBudget?: number): number => {
  if (!maxBudget || maxBudget === 0) return 0;
  return Math.min((spend / maxBudget) * 100, 100);
};
