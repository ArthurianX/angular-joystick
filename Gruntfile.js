'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    connect: {
      main: {
        options: {
          port: 9001
        }
      }
    },
    watch: {
      main: {
        options: {
          livereload: true,
          livereloadOnError: false,
          spawn: false
        },
        files: ['angular-joystick.html','angular-joystick.js','angular-joystick.scss','dist/**/*','demo/**/*','images/**/*'],
        tasks: ['jshint','build']
      }
    },
    dataUri: {
      dist: {
        src: ['images/processed-images.scss'],
        dest: './',
        options: {
          target: ['images/*.*'],
          fixDirLevel: true,
          maxBytes : 2048000
        }
      }
    },
    ngtemplates: {
      main: {
        options: {
          module:'artJoystick',
          base:''
        },
        src:'angular-joystick.html',
        dest: 'temp/templates.js'
      }
    },
    jshint: {
      main: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'angular-joystick.js'
      }
    },
    jasmine: {
      unit: {
        src: [
          './bower_components/jquery/dist/jquery.js',
          './bower_components/angular/angular.js',
          './bower_components/angular-animate/angular-animate.js',
          './bower_components/angular-mocks/angular-mocks.js',
          './dist/angular-joystick.js',
          './demo/demo.js'
        ],
        options: {
          specs: 'test/*.js'
        }
      }
    },
    concat: {
      main: {
        src: ['angular-joystick.js', 'temp/templates.js'],
        dest: 'dist/angular-joystick.js'
      }
    },
    uglify: {
      main: {
        files: [
        {src:'dist/angular-joystick.js',dest:'dist/angular-joystick.min.js'}
        ]
      }
    },
    sass: {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'dist/angular-joystick.css': 'angular-joystick.scss'
        }
      }
    },
    cssmin: {
      main: {
        files: {
          'dist/angular-joystick.min.css': 'dist/angular-joystick.css'
        }
      }
    },
    notify_hooks: {
      options: {
        enabled: true,
        max_jshint_notifications: 5, // maximum number of notifications from jshint output
        success: true, // whether successful grunt executions should be notified automatically
        duration: 1 // the duration of notification in seconds, for `notify-send only
      }
    }
  });

  grunt.task.run('notify_hooks');
  grunt.registerTask('serve', ['jshint','connect', 'watch']);
  grunt.registerTask('build',['ngtemplates','concat','uglify','dataUri:dist','sass','cssmin']);
  grunt.registerTask('test',['build','jasmine']);

};