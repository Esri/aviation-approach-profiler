/*global module:false*/
module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    copy: {
      main: {
        files: [{
          expand: true,
          src: [
            'style/main.css',
            'bower_components/fontawesome/css/font-awesome.min.css'
          ],
          dest: 'assets/css',
          flatten: true
        }, {
          expand: true,
          src: [
            'bower_components/fontawesome/fonts/**'
          ],
          dest: 'assets/fonts',
          flatten: true,
          filter: 'isFile'
        }, {
          expand: true,
          src: [
            'bower_components/backbone/backbone-min.js',
            'bower_components/bootstrap_sass/assets/javascripts/bootstrap.min.js',
            'bower_components/underscore/underscore-min.js',
            'bower_components/underscore/underscore-min.map',
            'bower_components/jquery/jquery.min.js',
            'bower_components/respond/src/respond.js',
            'bower_components/d3/d3.min.js'
          ],
          dest: './lib',
          flatten: true
        }, ]
      },
      bootstrap_sass: {
        files: [{
          expand: true,
          src: [
            'bower_components/bootstrap-sass/assets/stylesheets/**'
          ],
          dest: 'style/scss/bootstrap_sass',
        }]
      },
      release: {
        files: [{
          cwd: 'assets',
          src: ['**'],
          dest: 'release/assets',
          expand: true
        }, {
          cwd: 'js',
          src: ['**'],
          dest: 'release/js',
          expand: true
        }, {
          cwd: 'lib',
          src: ['**'],
          dest: 'release/lib',
          expand: true
        }, {
          cwd: 'proxy',
          src: ['**'],
          dest: 'release/proxy',
          expand: true
        }, {
          expand: true,
          src: 'index.html',
          dest: 'release',
        }]
      }
    },

    watch: {
      css: {
        files: ['style/scss/appStyles/*.scss'],
        tasks: ['sass']
      }
    },

    sass: {
      dist: {
        files: {
          'assets/css/main.css': 'style/scss/main.scss'
        }
      }
    },

    removelogging: {
      dist: {
        src: 'release/js/**/*.js',
        options: {}
      }
    },

    clean: {
      release: {
        src: ['release']
      },
      options: {
        force: true
      }
    },

    bower:{
      install: {}
    }
  });

  // Default task.
  grunt.registerTask('default', ['watch']);

  // Other tasks.
  grunt.registerTask('import-bootstrap', ['copy:bootstrap']);
  grunt.registerTask('init', ['bower', 'copy:main']);
  grunt.registerTask('build', ['clean:release', 'copy:release', 'removelogging']);
};