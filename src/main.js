#!/usr/bin/env node
const loader = require('taskcluster-lib-loader');
const libApp = require('taskcluster-lib-app');
const config = require('typed-env-config');

var load = loader({
  cfg: {
    requires: ['profile'],
    setup: ({profile}) => config({profile}),
  },

  router: {
    requires: [],
    setup: () => {
      return (req, res) => {
        res.status(200).json({'ping': true});
      };
    },
  },

  docs: {
    requires: ['cfg'],
    setup: ({cfg}) => docs.documenter({
      tier: 'integrations',
      publish: false,
    }),
  },


  writeDocs: {
    requires: ['docs'],
    setup: ({docs}) => docs.write({docsDir: process.env['DOCS_OUTPUT_DIR']}),
  },

  server: {
    requires: ['cfg', 'router'],
    setup: ({cfg, router}) => {
      let app = libApp({
        port:           Number(process.env.PORT || cfg.server.port),
        env:            cfg.server.env,
        forceSSL:       cfg.server.forceSSL,
        trustProxy:     cfg.server.trustProxy,
        rootDocsLink:   false,
      });

      // Mount API router
      app.use('/v1', router);

      // Create server
      return app.createServer();
    },
  },
}, ['process', 'profile']);

// If this file is executed launch component from first argument
if (!module.parent) {
  load(process.argv[2], {
    process: process.argv[2],
    profile: process.env.NODE_ENV,
  }).catch(err => {
    console.log(err.stack);
    process.exit(1);
  });
}

// Export load for tests
module.exports = load;
