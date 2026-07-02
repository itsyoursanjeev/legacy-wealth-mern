const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

const calcInvestment = (principal, monthlyRate, monthsActive) => {
  if (!principal || principal <= 0) return { currentValue: 0, growth: 0, growthPercent: 0 };
  const currentValue = principal * Math.pow(1 + monthlyRate / 100, monthsActive);
  const growth = currentValue - principal;
  const growthPercent = (growth / principal) * 100;
  return { currentValue, growth, growthPercent };
};

const calcProjections = (principal, monthlyRate, monthsActive, periods = 12) => {
  return Array.from({ length: periods }, (_, i) => ({
    month: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000)
      .toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
    value: Math.round(principal * Math.pow(1 + monthlyRate / 100, monthsActive + i + 1)),
    fd: Math.round(principal * Math.pow(1 + 0.065 / 12, monthsActive + i + 1)),
    nifty: Math.round(principal * Math.pow(1 + 0.12 / 12, monthsActive + i + 1))
  }));
};

const calcMonthsActive = (startDate) => {
  return Math.max(0, (Date.now() - new Date(startDate).getTime()) / MS_PER_MONTH);
};

module.exports = { calcInvestment, calcProjections, calcMonthsActive };
