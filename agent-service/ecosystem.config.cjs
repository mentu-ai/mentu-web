module.exports = {
  apps: [{
    name: 'agent-service',
    script: 'npx',
    args: 'tsx src/index.ts',
    cwd: '/home/mentu/Workspaces/mentu-web/agent-service',
    env: {
      HOME: '/home/mentu',
      PATH: process.env.PATH,
      NODE_ENV: 'production'
    }
  }]
};
