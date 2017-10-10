'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.devTasks = devTasks;

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _webpackDevServer = require('webpack-dev-server');

var _webpackDevServer2 = _interopRequireDefault(_webpackDevServer);

var _gulpOpen = require('gulp-open');

var _gulpOpen2 = _interopRequireDefault(_gulpOpen);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _deepAssign = require('deep-assign');

var _deepAssign2 = _interopRequireDefault(_deepAssign);

var _gulpOptionsBuilder = require('./gulp-options-builder');

var _gulpOptionsBuilder2 = _interopRequireDefault(_gulpOptionsBuilder);

var _gulpTasksCore = require('./gulp-tasks-core');

var _gulpTasksCore2 = _interopRequireDefault(_gulpTasksCore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function devTasks(gulp, opts) {

  var runSequence = require('run-sequence').use(gulp);

  (0, _gulpTasksCore2.default)(gulp, opts);

  var options = (0, _gulpOptionsBuilder2.default)(opts);

  gulp.task('dev-preprocess', function (callback) {
    if (!options.argv.preprocess) {
      callback();
      return;
    }

    if (options.devPreprocess) {
      runSequence('clean', 'generate-icons', options.devPreprocess, 'copy', callback);
    } else {
      runSequence('clean', 'generate-icons', 'copy', callback);
    }
  });

  gulp.task('dev', ['dev-preprocess'], function () {

    var webpackConfigPath = _path2.default.resolve(__dirname, 'webpack.dev.config.js');

    if (options.argv.config) {
      webpackConfigPath = _path2.default.resolve(options.argv.config);
    }

    var config = require(webpackConfigPath);

    var devServerConfig = {
      contentBase: options.dist,
      hot: !options.devServerDisableHot,
      inline: true,
      stats: {
        colors: true
      },
      publicPath: config.output.publicPath,
      historyApiFallback: true
    };

    if (options.watchOptions) {
      devServerConfig.watchOptions = options.watchOptions;
    }

    if (options.devServerProxy) {
      devServerConfig.proxy = options.devServerProxy;
    }

    if (options.devServer) {
      (0, _deepAssign2.default)(devServerConfig, options.devServer);
    }

    if (options.webpackProfile) config.profile = true;

    var compiler = (0, _webpack2.default)(config);

    if (options.webpackProfile) {
      compiler.plugin('done', function (stats) {
        var profileFile = _path2.default.resolve(options.webpackProfile);
        var statsString = JSON.stringify(stats.toJson());
        (0, _fs.writeFile)(profileFile, statsString, function (err) {
          if (err) return console.error('Failed to write webpackProfile:', err);
          console.log('[webpack] Wrote webpack stats to:', profileFile);
          console.log('[webpack] Analyze stats at https://webpack.github.io/analyse/');
        });
      });
    }

    var server = new _webpackDevServer2.default(compiler, devServerConfig);

    server.use('/', function (req, res, next) {

      var acceptLanguageHeader = req.headers['accept-language'];

      if (acceptLanguageHeader) {
        var acceptedLanguages = acceptLanguageHeader.match(/[a-zA-z\-]{2,10}/g);
        if (acceptedLanguages) {
          res.cookie('languages', JSON.stringify(acceptedLanguages));
        }
      }

      if (req.url.match(/.+\/img\//)) {
        // img
        res.redirect(301, req.url.replace(/.*\/(img\/.*)$/, '/$1'));
      } else if (req.url.match(/\/img\//)) {
        // img
        next();
      } else if (req.url.match(/.+\/video\//)) {
        // video
        res.redirect(301, req.url.replace(/.*\/(video\/.*)$/, '/$1'));
      } else if (req.url.match(/\/video\//)) {
        // video
        next();
      } else if (req.url.match(/.+\/font\//)) {
        // font
        res.redirect(301, req.url.replace(/.*\/(font\/.*)$/, '/$1'));
      } else if (req.url.match(/\/font\//)) {
        // font
        next();
      } else if (req.url.match(/.+\/.*\.[^\/]*$/)) {
        // file
        res.redirect(301, req.url.replace(/.*\/([^\/]*)$/, '/$1'));
      } else {
        next();
      }
    });

    // Always open on all ports unless overridden
    var host = options.devServerHost || '0.0.0.0';

    server.listen(options.devServerPort || 8080, host, function (err) {
      if (err) {
        console.error('[webpack-dev-server] failed to start:', err);
      } else {
        var protocol = options.devServer && options.devServer.https ? 'https' : 'http';
        var openHost = host === '0.0.0.0' ? 'localhost' : host;
        var suffix = options.publicPath ? options.publicPath + '/' : '';
        var openURL = protocol + '://' + openHost + ':' + options.devServerPort + suffix;

        var openMsg = '[webpack-dev-server] started: ';
        if (!options.argv.open) {
          openMsg += 'app available at location: \x1B[33m' + openURL + '\x1B[39m';
        } else {
          openMsg += 'opening the app in your default browser...';
        }

        console.log(openMsg);
        if (!options.argv.open) return;

        gulp.src(__filename).pipe((0, _gulpOpen2.default)({
          uri: openURL
        }));
      }
    });

    server.app.get('/reload', function (req, res) {
      // Tell connected browsers to reload.
      server.sockWrite(server.sockets, 'ok');
      res.sendStatus(200);
    });

    server.app.get('/invalid', function (req, res) {
      // Tell connected browsers some change is about to happen.
      server.sockWrite(server.sockets, 'invalid');
      res.sendStatus(200);
    });
  });
};

var _default = devTasks;
exports.default = _default;
;

var _temp = function () {
  if (typeof __REACT_HOT_LOADER__ === 'undefined') {
    return;
  }

  __REACT_HOT_LOADER__.register(devTasks, 'devTasks', 'src/gulp-tasks-dev.js');

  __REACT_HOT_LOADER__.register(_default, 'default', 'src/gulp-tasks-dev.js');
}();

;