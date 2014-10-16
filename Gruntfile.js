'use strict';

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            target: ['Gruntfile.js', 'angular-poller.js', 'test/*.js']
        },
        karma: {
            develop: {
                configFile: 'karma.conf.js'
            },
            continuous: {
                configFile: 'karma.conf.js',
                singleRun: true,
                browsers: ['PhantomJS']
            }
        },
        coveralls: {
            options: {
                src: 'coverage/report/lcov.info'
            }
        },
        ngmin: {
            factory: {
                files: [
                    {
                        src: 'angular-poller.js',
                        dest: 'angular-poller.min.js'
                    }
                ]
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    '<%= pkg.name %>.min.js': ['angular-poller.min.js']
                }
            }
        }
    });

    grunt.registerTask('develop', ['jshint', 'karma:develop']);
    grunt.registerTask('test', ['jshint', 'karma:continuous', 'coveralls']);
    grunt.registerTask('default', ['test', 'ngmin', 'uglify']);
};