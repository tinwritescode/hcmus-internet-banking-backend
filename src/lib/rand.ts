export const getRandomBankNumber = (length: number = 10) => {
  return Math.floor(Math.random() * Math.pow(10, length));
};
