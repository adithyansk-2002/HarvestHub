module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // Use Ganache
      network_id: "*",
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",
    },
  },
};
