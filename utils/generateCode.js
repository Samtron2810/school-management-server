const generateCode = (prefix, number, length = 4) => {
  return `${prefix}${String(number).padStart(length, "0")}`;
};

export default generateCode;
