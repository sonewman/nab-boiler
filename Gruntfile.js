module.exports = function (grunt) {

  //  Config values
  var configFolders = {
      pub: 'public'
      , client: 'client'
      , shared: 'shared'
      , server: 'server'
      , styl: 'styl'
      , views: 'views'
      , browserified: '.browserified'
    }
    , NODE_SERVER_PORT = 3000
    , MAIN_SCRIPT = 'main.js'
    , MAIN_SCRIPT_OUT = 'z-bundle.js'


  //  under the hood config
    , LIVERELOAD_PORT = 35733/*35729*/
    , lrSnippet = require('connect-livereload')({ port: LIVERELOAD_PORT })
    , proxyRequest = require('grunt-connect-proxy/lib/utils').proxyRequest;
  
  function mountFolder (connect, dir) {
    return connect.static(require('path').resolve(dir));
  }

  function stripIfNoneMatch (req, res, next) {
    //  strip annoying header which
    //  stops the page from being rendered
    //  not very helpful in development
    if (req.headers['if-none-match'])
      delete req.headers['if-none-match'];
    next();
  }


  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.initConfig({
    //  set config
    yeoman: configFolders

    //  declare watch tasks
    , watch: {

      //  script watching
      scripts: {
        files: [
          '<%= yeoman.client %>/**/*.js'
          , '<%= yeoman.shared %>/**/*.js'
          , '<%= yeoman.views %>/**/*.jade'
        ]
        , tasks: [
          // 'jshint'
          'bundle'
        ]
      }

      //  live reload
      , livereload: {
        options: {
          livereload: LIVERELOAD_PORT
        }
        , files: [
          '<%= yeoman.pub %>/styles/{,*/}*.css'
          , '<%= yeoman.pub %>/scripts/{,*/}*.js'
          , '<%= yeoman.pub %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }

      //  stylus - watch styl sheets
      , stylus: {
        files: ['<%= yeoman.styl %>/**/*.styl'],
        tasks: ['stylus']
      }
    }

    // node inspector
    , 'node-inspector': {
      custom: {
        options: {
          'web-port': 1337
          , 'web-host': '0.0.0.0'
          , 'debug-port': 5857
          , 'save-live-edit': true
        }
      }
    }

    , open: {
      server: { url: 'http://<%= connect.livereload.options.hostname %>:<%= connect.livereload.options.port %>', app:'Google Chrome' }
    }

    //  declare concurrent tasks
    , concurrent: {
      dev: {
        tasks: [
          'node-inspector'
          , 'nodemon'
          , 'open'
          , 'watch'
        ]
        , options: {
          logConcurrentOutput: true
        }
      }
    }

    //  connect server
    , connect: {
      livereload: {
        options: {
          port: 9090
          , hostname: '0.0.0.0'
          ,
          middleware: function (connect) {
            return [
              lrSnippet
              , mountFolder(connect, 'public')
              , stripIfNoneMatch
              , proxyRequest
            ];
          }
        }
      }
      , test: {
        options: {
          port: 9898,
          middleware: function (connect) {
            return [
              mountFolder(connect, 'public')
              , mountFolder(connect, 'test')
              , stripIfNoneMatch
              , proxyRequest
            ];
          }
        }
      }
      , proxies: [{
        context: '/'
        , host: '0.0.0.0'
        , port: NODE_SERVER_PORT
        , https: false
        , changeOrigin: true
        , xforward: true
      }]
    }

    , nodemon: {
      dev: {
        options: {
          file: 'app.js'
          // , args: ['dev']
          // , nodeArgs: ['--debug']
          , ignoredFiles: ['node_modules/**']
          , watchedExtensions: ['js']
          , watchedFolders: ['server']
          // , delayTime: 1
          , legacyWatch: true
          , env: {
            PORT: NODE_SERVER_PORT
          }
          , cwd: __dirname
        }
      }
    }

    , browserify: {
      basic: {
        src: [
          '<%= yeoman.client %>/' + MAIN_SCRIPT
        ],
        options: {
          debug: true,
          transform: [
            'coffeeify'
            , 'brfs'
          ]
        },
        dest: '<%= yeoman.browserified %>/' + MAIN_SCRIPT_OUT
      }
    }

    , stylus: {
      compile: {
        options: {
          compress: true,
          paths: ['node_modules/grunt-contrib-stylus/node_modules']
        },
        files: {
          '<%= yeoman.pub %>/styles/style.css': ['<%= yeoman.styl %>/style.styl']
        }
      }
    }

    , copy: {
      browserified: {
        expand: true,
        cwd: '<%= yeoman.browserified %>',
        dest: '<%= yeoman.pub %>/scripts',
        src: '{,*/}*.js'
      }
    }


    , clean: {
      styles: '<%= yeoman.pub %>/styles'

      , browserified: '<%= yeoman.browserified %>'
    }

    , jshint: {
      options: {jshintrc: '.jshintrc'},
      all: [
        'Gruntfile.js'
        , '<%= yeoman.pub %>/{,*/}*.js'
        , '<%= yeoman.shared %>/{,*/}*.js'
        , '<%= yeoman.server %>/{,*/}*.js'
      ]
    }

    , karma: {
      unit: {
        configFile: 'karma.conf.js'
        , singleRun: true
      }
    }

    , 'jasmine_node': {
      specNameMatcher: 'spec' // load only specs containing specNameMatcher
      , projectRoot: './test/server/specs/'
      , requirejs: false
      , forceExit: true
    }
  });

  grunt.registerTask('server', [
    //  set up files
    'styles'
    , 'bundle'
    //  set up server stuff
    , 'configureProxies'
    , 'connect:livereload'
    , 'concurrent'
  ]);

  grunt.registerTask('test', [
    'ctest'
    , 'jasmine'
  ]);

  grunt.registerTask('ctest', [
    'bundle'
    , 'connect:test'
    , 'karma'
  ]);

  grunt.registerTask('jasmine', [
    'jasmine_node'
  ]);

  grunt.registerTask('styles', [
    'clean:styles'
    , 'stylus'
  ]);

  grunt.registerTask('bundle', [
    'browserify'
    , 'copy:browserified'
    , 'clean:browserified'
  ]);

};