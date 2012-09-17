var sources = require('./json/_sources');

Object.keys(sources).forEach(function(name){
  var json;
  exports[name] = function(){
    if (!json) {
      json = require('./json/'+name);
      Object.defineProperty(json, '_source', { configurable: true, value: sources[name] });
    }
    return json;
  };
});
