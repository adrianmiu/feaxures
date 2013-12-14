module.exports = function(grunt) {

	// 1. All configuration goes here
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),

		jshint: {
			all: ['src/*.js', 'dist/*.js']
		},
		
		uglify : {
			main : {
				src : 'src/feaxures.js',
				dest : 'dist/feaxures.js'
			}
		},

		watch : {
			scripts : {
				files : [ 'src/*.js' ],
				tasks : [ 'uglify', 'jshint' ],
				options : {
					spawn : false,
				},
			}
		}
	});

	// 3. Where we tell Grunt we plan to use this plug-in.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	
	// 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
	grunt.registerTask('default', ['jshint', 'uglify' ]);

};