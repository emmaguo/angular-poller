'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            target: [
                'Gruntfile.js',
                'angular-poller.js',
                'test/*.js'
            ]
        },
        jscs: {
            src: [
                'Gruntfile.js',
                'angular-poller.js',
                'test/*.js'
            ],
            options: {
                config: '.jscsrc'
            }
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
                force: true
            },
            target: {
                src: 'coverage/report/lcov.info'
            }
        },
        ngAnnotate: {
            target: {
                files: {
                    'angular-poller.min.js': 'angular-poller.js'
                }
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

    grunt.registerTask(
        'develop', [
            'jshint',
            'jscs',
            'karma:develop'
        ]
    );

    grunt.registerTask(
        'test', [
            'jshint',
            'jscs',
            'karma:continuous',
            'coveralls'
        ]
    );

    grunt.registerTask(
        'default', [
            'test',
            'ngAnnotate',
            'uglify'
        ]
    );
};
