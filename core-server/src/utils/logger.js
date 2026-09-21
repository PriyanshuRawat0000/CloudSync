const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../logs');
if (!fs.existsSync(logPath)) fs.mkdirSync(logPath, { recursive: true });

const writeLog = (eventType, payload = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    eventType,
    ...payload,
  };
  const file = path.join(logPath, `${eventType.toLowerCase()}.log`);
  fs.appendFileSync(file, `${JSON.stringify(entry)}\n`);
};

module.exports = { writeLog };
