var fs = require('fs');
var path = require('path');
var parseIDL = require('webidl.js').webidl;
var tags = require('./tags');

tags = Object.keys(tags).reduce(function(ret, type){
  Object.keys(tags[type]).forEach(function(tag){
    if (tags[type][tag] === '')
      var name = type + tag[0].toUpperCase() + tag.slice(1) + 'Element'
    else
      var name = type + tags[type][tag] + 'Element';
    ret[name] = tag;
  });
  return ret;
}, {});



var allDefinitions = {},
    allImplements = [];

var types = {
  'unsigned short'     : 'Uint16',
  'unsigned long'      : 'Uint32',
  'unsigned long long' : 'Uint64',
  octet                : 'Int8',
  short                : 'Int16',
  long                 : 'Int32',
  'long long'          : 'Int64',
  float                : 'Float32',
  single               : 'Float32',
  double               : 'Float64',
  DOMTimeStamp         : 'Number',
  DOMString            : 'String',
  boolean              : 'Boolean',
  object               : 'Object',
  DOMObject            : 'Object',
  void                 : 'Void',
  DOMUserData          : 'Any',
  any                  : 'Any',
};

function isObject(o){
  return Object(o) === o;
}

function type(json){
  if (json === 'void')
    return 'Void';
  if (isObject(json)) {
    if (isObject(json.idlType))
      return type(json.idlType);
    if (!types[json.idlType])
      return json.idlType;
    var name = types[json.idlType];
    if (json.sequence)
      name += 'Sequence';
    if (json.array)
      name += 'Array';

    return name;
  }
}

function hidden(o, n, v){
  Object.defineProperty(o, n, {
    value: v,
    configurable: true,
    writable: true,
    enumerable: false
  });
}

function arrayize(a, b){
  if (a === b)
    return a;
  a = Array.isArray(a) ? a : [a];
  if (!~a.indexOf(b))
    a.push(b);
  return a;
}

function merge(from, to){
  isObject(from) && isObject(to) && Object.keys(from).forEach(function(key){
    if (key === 'NoInterfaceObject') return;
    if (key in to)  {
      if (isObject(to[key]) && isObject(from[key]))
        merge(from[key], to[key]);
    } else
      to[key] = from[key];
  });
}

var definitionTypes = {
  implements: function(json){
    allImplements.push(json);
  },
  typedef: function(json){},
  interface: function(json){
    return new Interface(json);
  },
  partialinterface: function(json){
    var iface = new Interface(json);
    if (json.name in allDefinitions)
      merge(iface, allDefinitions[json.name]);
    else
      return iface;
  },
  dictionary: function(json){
    return new Dictionary(json);
  },
  enum: function(json){
    return new Enum(json);
  },
};

var memberTypes = {
  const: function(o){
    return isFinite(o.value) ? +o.value : o.value;
  },
  operation: function(o){
    return new Operation(o);
  },
  readonly: function(o){
    return type(o.idlType);
  },
  attribute: function(o){
    return type(o.idlType);
  },
  accessor: function(o){
    return new Operation(o);
  }
};


function Definition(type){
  Object.defineProperty(this, 'type', { value: type, enumerable: true });
}

Definition.prototype = {};



function Interface(json){
  if (!json) return;
  this.type = 'interface';
  var self = this;
  hidden(this, 'name', json.name);
  if (json.name in tags)
    this.tag = tags[json.name];
  this.inherits = typeof json.inheritance === 'string' ? json.inheritance === '' ? [] : [json.inheritance] : json.inheritance;
  json.members && json.members.forEach(function(member){
    if (member.readonly)
      member.type = 'readonly'
    if (!member.name) {
      if (member.stringifier)
        member.name = 'toString';
      else {
        member.type = 'accessor';
        member.name = member[0];
      }
    }
    var t = member.type + 's';
    var n = member.name;
    var set = this[t] = this[t] || Object.create(null);
    if (!(member.type in memberTypes))
      return console.log(member);
    var item = memberTypes[member.type](member);
    if (n in set && t === 'operations') {
      var existing = set[n];
      existing.returns = arrayize(existing.returns, item.returns);
      existing.args = existing.args || {};
      Object.keys(item.args).forEach(function(name){
        existing.args[name] = name in existing.args ? arrayize(existing.args[name], item.args[name]) : item.args[name];
      });
    } else
      set[n] = item;
  }, this);
  if (json.extAttrs) {
    json.extAttrs.forEach(function(attr){
      if (Object.keys(attr).length === 1 && attr.name) {
        if (attr.name === 'Constructor')
          self.construct = {}
        else
          self[attr.name] = true;
      } else if (attr.name === 'Constructor') {
        self.construct = new Operation(attr);
      } else if (attr.name === 'NamedConstructor') {
        self.construct = new Operation(attr);
        Object.defineProperty(self.construct, 'name', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: attr.value
        });
      } else {
        self[attr.name] = attr;
        delete attr.name
      }
    });
  }
}

Interface.prototype = new Definition('interface');



function Dictionary(json){
  this.type = 'dictionary';
  this.inherits = typeof json.inheritance === 'string' ? json.inheritance === '' ? [] : [json.inheritance] : json.inheritance;
  hidden(this, 'name', json.name);
  var members = this.members = {};
  json.members.forEach(function(member){
    members[member.name] = type(member.type);
  });
}

Dictionary.prototype = new Definition('dictionary');



function Enum(json){
  this.type = 'enum';
  hidden(this, 'name', json.name);
  this.values = json.values;
}

Enum.prototype = new Definition('enum');




function Operation(json){
  hidden(this, 'name', json.name);
  var t = type(json.idlType);
  if (t !== 'Void')
    this.returns = t;
  var args = {};
  if (isObject(json.arguments)) {
    json.arguments.forEach(function(s){
      args[s.name] = type(s.type);
    });
  }
  if (Object.keys(args).length)
    this.args = args;
  if (json.extAttrs)
    console.log(json.extAttrs);
}




var conversionStanza = [
  function open(state, filename){
    state.name = filename;
    return fs.readFileSync(filename, 'utf8');
  },

  function parse(state, text){
    return parseIDL.parse(text);
  },

  function reorganize(state, json){
    var out = {};
    json.forEach(function(item){
      if (item.type in definitionTypes) {
        var result = definitionTypes[item.type](item);
        if (result)
          out[item.name] = allDefinitions[item.name] = result;
      } else {
        console.log(item);
      }
    });
    allImplements.forEach(function(impl){
      var target = out[impl.target];
      var source = allDefinitions[impl.implements];
      delete out[impl.implements];
      if (source && target)
        merge(source, target);
    });
    return out;
  },

  function stringify(state, json){
    return JSON.stringify(json, null, '\t');
  },

  function save(state, text){
    var name = path.basename(state.name).slice(0, -path.extname(state.name).length);
    var out = path.resolve(state.out, name+'.json');
    fs.writeFileSync(out, text);
  }
];

function stanzaRunner(ops, input, state){
  state = state || {};
  return ops.reduce(function(ret, op){
    return op(state, ret);
  }, input);
}


function convert(file, outdir){
  try {
    return stanzaRunner(conversionStanza, file, { out: outdir })
  } catch (e) {
    e.file = file;
    console.log(e.stack || e);
  }
}

fs.readdirSync('./idl').forEach(function(name){
  convert('./idl/'+name, './json');
});
