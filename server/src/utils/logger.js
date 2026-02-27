const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({ level: 'INFO', timestamp, message }));
  },
  warn: (message) => {
    const timestamp = new Date().toISOString();
    console.warn(JSON.stringify({ level: 'WARN', timestamp, message }));
  },
  error: (message, stack = undefined) => {
    const timestamp = new Date().toISOString();
    console.error(JSON.stringify({ level: 'ERROR', timestamp, message, stack }));
  }
};

export default logger;