const event = {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`
    ############################################################
    #  Logged in as ${client.user.username}!
    #  Serving ${client.guilds.cache.size} servers.
    #  Serving ${client.users.cache.size} users.
    ############################################################
  `);
  },
};

export default event;
