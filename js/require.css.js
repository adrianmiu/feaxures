/*
 * css! loader plugin
 * Allows for loading stylesheets with the 'css!' syntax.
 *
 * External stylesheets supported.
 * 
 * '!' suffix skips load checking
 *
 */
define([], function() {
  var normalize = (function() {
    // regular expression for removing double slashes
    // eg http://www.example.com//my///url/here -> http://www.example.com/my/url/here
    var slashes = /(^\/+)|([^:])\/+/g
    var removeDoubleSlashes = function(uri) {
      return uri.replace(slashes, '$2/');
    }

    // given a relative URI, and two absolute base URIs, convert it from one base to another
    function convertURIBase(uri, fromBase, toBase) {
      uri = removeDoubleSlashes(uri);
      // absolute urls are left in tact
      if (uri.match(/^\/|([^\:\/]*:)/))
        return uri;
      return relativeURI(absoluteURI(uri, fromBase), toBase);
    };

    // given a relative URI, calculate the absolute URI
    function absoluteURI(uri, base) {
      if (uri.substr(0, 2) == './')
        uri = uri.substr(2);    

      var baseParts = base.split('/');
      var uriParts = uri.split('/');

      baseParts.pop();

      while (curPart = uriParts.shift())
        if (curPart == '..')
          baseParts.pop();
        else
          baseParts.push(curPart);

      return baseParts.join('/');
    };


    // given an absolute URI, calculate the relative URI
    function relativeURI(uri, base) {

      // reduce base and uri strings to just their difference string
      var baseParts = base.split('/');
      baseParts.pop();
      base = baseParts.join('/') + '/';
      i = 0;
      while (base.substr(i, 1) == uri.substr(i, 1))
        i++;
      while (base.substr(i, 1) != '/')
        i--;
      base = base.substr(i + 1);
      uri = uri.substr(i + 1);

      // each base folder difference is thus a backtrack
      baseParts = base.split('/');
      var uriParts = uri.split('/');
      out = '';
      while (baseParts.shift())
        out += '../';

      // finally add uri parts
      while (curPart = uriParts.shift())
        out += curPart + '/';

      return out.substr(0, out.length - 1);
    };

    var normalizeCSS = function(source, fromBase, toBase) {

      fromBase = removeDoubleSlashes(fromBase);
      toBase = removeDoubleSlashes(toBase);

      var urlRegEx = /(url\(\s*"([^\)]*)"\s*\))|(url\(\s*'([^\)]*)'\s*\))|(url\(\s*([^\)]*)\s*\))/g;
      var result, url, source;

      while (result = urlRegEx.exec(source)) {
        url = result[2] || result[4] || result[6];
        var newUrl = convertURIBase(url, fromBase, toBase);
        var quoteLen = result[2] || result[4] ? 1 : 0;
        source = source.substr(0, urlRegEx.lastIndex - url.length - quoteLen - 1) + newUrl + source.substr(urlRegEx.lastIndex - quoteLen - 1);
        urlRegEx.lastIndex = urlRegEx.lastIndex + (newUrl.length - url.length);
      }

      var importRegEx = /(@import\s*'(.*)')|(@import\s*"(.*)")/g;

      while (result = importRegEx.exec(source)) {
        url = result[2] || result[4];
        var newUrl = convertURIBase(url, fromBase, toBase);
        source = source.substr(0, importRegEx.lastIndex - url.length - 1) + newUrl + source.substr(importRegEx.lastIndex - 1);
        importRegEx.lastIndex = importRegEx.lastIndex + (newUrl.length - url.length);
      }

      return source;
    };

    normalizeCSS.convertURIBase = convertURIBase;

    return normalizeCSS;      
  })();
  
  if (typeof window == 'undefined')
    return { load: function(n, r, load){ load() } };
  
  var head = document.getElementsByTagName('head')[0];
  
  
  /* XHR code - copied from RequireJS text plugin */
  var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
  var get = function(url, callback, errback) {
  
    var xhr, i, progId;
    if (typeof XMLHttpRequest !== 'undefined')
      xhr = new XMLHttpRequest();
    else if (typeof ActiveXObject !== 'undefined')
      for (i = 0; i < 3; i += 1) {
        progId = progIds[i];
        try {
          xhr = new ActiveXObject(progId);
        }
        catch (e) {}
  
        if (xhr) {
          progIds = [progId];  // so faster next time
          break;
        }
      }
    
    xhr.open('GET', url, requirejs.inlineRequire ? false : true);
  
    xhr.onreadystatechange = function (evt) {
      var status, err;
      //Do not explicitly handle errors, those should be
      //visible via console output in the browser.
      if (xhr.readyState === 4) {
        status = xhr.status;
        if (status > 399 && status < 600) {
          //An http 4xx or 5xx error. Signal an error.
          err = new Error(url + ' HTTP status: ' + status);
          err.xhr = xhr;
          errback(err);
        }
        else
          callback(xhr.responseText);
      }
    };
    
    xhr.send(null);
  }
  
  //main api object
  var cssAPI = {};
  
  cssAPI.pluginBuilder = './css-builder';
  
  //<style> tag creation
  var stylesheet = document.createElement('style');
  stylesheet.type = 'text/css';
  head.appendChild(stylesheet);
  
  if (stylesheet.styleSheet)
    cssAPI.inject = function(css) {
      stylesheet.styleSheet.cssText += css;
    }
  else
    cssAPI.inject = function(css) {
      stylesheet.appendChild(document.createTextNode(css));
    }

  cssAPI.inspect = function() {
    if (stylesheet.styleSheet)
      return stylesheet.styleSheet.cssText;
    else if (stylesheet.innerHTML)
      return stylesheet.innerHTML;
  }
  
  var instantCallbacks = {};
  cssAPI.normalize = function(name, normalize) {
    var instantCallback;
    if (name.substr(name.length - 1, 1) == '!')
      instantCallback = true;
    if (instantCallback)
      name = name.substr(0, name.length - 1);
    if (name.substr(name.length - 4, 4) == '.css')
      name = name.substr(0, name.length - 4);
    
    name = normalize(name);
    
    if (instantCallback)
      instantCallbacks[name] = instantCallback;
    
    return name;
  }
  
  cssAPI.load = function(cssId, req, load, config, parse) {
    var instantCallback = instantCallbacks[cssId];
    if (instantCallback)
      delete instantCallbacks[cssId];
    
    var fileUrl = cssId;
    
    if (fileUrl.substr(fileUrl.length - 4, 4) != '.css' && !parse)
      fileUrl += '.css';
    
    fileUrl = req.toUrl(fileUrl);
    
    //external url -> add as a <link> tag to load. onload support not reliable so not provided
    if (fileUrl.substr(0, 7) == 'http://' || fileUrl.substr(0, 8) == 'https://') {
      if (parse)
        throw 'Cannot preprocess external css.';
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = fileUrl;
      head.appendChild(link);
      
      //only instant callback due to onload not being reliable
      load(cssAPI);
    }
    //internal url -> download and inject into <style> tag
    else {
      get(fileUrl, function(css) {
          
        var pathname = window.location.pathname.split('/');
        pathname.pop();
        pathname = pathname.join('/') + '/';

        //make file url absolute
        if (fileUrl.substr(0, 1) != '/')
          fileUrl = '/' + normalize.convertURIBase(fileUrl, pathname, '/');
        
        css = normalize(css, fileUrl, pathname);

        if (parse)
          css = parse(css);

        cssAPI.inject(css);
          
        if (!instantCallback)
          load(cssAPI);
      });
      if (instantCallback)
        load(cssAPI);
    }
  }
  
  return cssAPI;
});
