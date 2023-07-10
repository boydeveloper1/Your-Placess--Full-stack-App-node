// Defining Express Error Class

class ExpressError extends Error {
  constructor(message, status) {
    super();
    this.message = message; // Adds a "message" propertyt
    this.statusCode = status; // Adds a "statusCode" property
  }
}

module.exports = ExpressError;
