const net = require('net');

const testPort = (host, port) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(50000); // 10 seconds timeout

    socket.on('connect', () => {
      console.log(`Successfully connected to ${host}:${port}`);
      socket.destroy();
      resolve(true);
    });

    socket.on('error', (err) => {
      console.error(`Error connecting to ${host}:${port} -`, err.message);
      reject(err);
    });

    socket.on('timeout', () => {
      console.error(`Connection to ${host}:${port} timed out`);
      socket.destroy();
      reject(new Error('Timeout'));
    });

    socket.connect(port, host);
  });
};

// Example usage:
const smtpHost = 'smtp.gmail.com';
const smtpPort = 443;

testPort(smtpHost, smtpPort)
  .then(() => {
    console.log(`Port ${smtpPort} is open`);
  })
  .catch(() => {
    console.log(`Port ${smtpPort} is blocked or unreachable`);
  });
