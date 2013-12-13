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
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
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
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    '<%= pkg.name %>.min.js': ['angular-poller.min.js']
                }
            }
        }
    });

    grunt.registerTask('test', ['jshint', 'karma']);
    grunt.registerTask('default', ['test', 'ngmin', 'uglify']);
};