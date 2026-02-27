export const log = (message, data = null) => {
  if (data) {
    console.log(`[LOG] ${message}`, data);
  } else {
    console.log(`[LOG] ${message}`);
  }
};