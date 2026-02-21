const parseTokenExpiryToDate = (decodedToken) => {
  if (!decodedToken.exp) {
    return null;
  }

  return new Date(decodedToken.exp * 1000);
};

module.exports = {
  parseTokenExpiryToDate,
};
