'use strict';

module.exports = function (grunt) {

  var config = {
    watch: {
      options: {
        livereload: true,
      },
      html: {
        files: ['index.html'],
        tasks: [],
        options: {
          spawn: false
        }
      },
      css: {
        files: ['css/*.css'],
        tasks: [],
        options: {
          spawn: false
        }
      },
      js: {
        files: ['js/*.js'],
        tasks: [],
        options: {
          spawn: false
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 8000,
          base: '',
          hostname: '*'
        }
      }
    },
  };

  grunt.initConfig(config);

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
  });

  grunt.registerTask('dev', ['connect', 'watch']);
};