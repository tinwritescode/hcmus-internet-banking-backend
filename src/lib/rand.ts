export const getRandomBankNumber = (length = 10) => {
  return Math.floor(Math.random() * Math.pow(10, length));
};
