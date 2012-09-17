var fs = require('fs');
var path = require('path');
var parseIDL = require('webidl.js').webidl;
var tags = require('./json/_tags');
var zlib = require('zlib');



function recase(s){
  return s[0].toUpperCase() + s.slice(1);
}


function hidden(o, n, v){
  Object.defineProperty(o, n, {
    value: v,
    configurable: true,
    writable: true,
    enumerable: false
  });
}

function isObject(o){
  return o != null && typeof o === 'object' || typeof o === 'function';
}


function arrayify(a, b){
  if (a !== b) {
    a instanceof Array || (a = [a]);
    ~a.indexOf(b) || a.push(b);
  }
  return a;
}


function merge(from, to){
  isObject(from) && isObject(to) && Object.keys(from).forEach(function(key){
    if (key in filter) return;
    if (key in to)  {
      merge(from[key], to[key]);
    } else
      to[key] = from[key];
  });
}

function sort(o){
  var out = {};
  Object.keys(o).sort().forEach(function(key){
    out[key] = o[key];
  });
  return out;
}

Object.keys(tags).forEach(function(type){
  var tagset = tags[type],
      name = [type, , 'Element'];

  name.toString = function(){ return this.join('') };
  delete tags[type];

  Object.keys(tagset).forEach(function(tag){
    name[1] = tagset[tag] || recase(tag);
    tags[name] = tag;
  });
});




var allDefinitions = {},
    allImplements = [];

var typeMap = {
  'byte'               : 'Uint8',
  'unsigned short'     : 'Uint16',
  'unsigned long'      : 'Uint32',
  'unsigned long long' : 'Uint64',
  'octet'              : 'Int8',
  'short'              : 'Int16',
  'long'               : 'Int32',
  'long long'          : 'Int64',
  'float'              : 'Float32',
  'single'             : 'Float32',
  'unrestricted float' : 'Float32',
  'double'             : 'Float64',
  'unrestricted double': 'Float64',
  'DOMString'          : 'String',
  'boolean'            : 'Boolean',
  'object'             : 'Object',
  'void'               : 'Void',
  'any'                : 'Any',
  'WindowProxy'        : 'Window'
};

var filter = {
  NoInterfaceObject: true,
  Supplemental: true,
  NamedPropertiesObject: true
};


function interpretType(json){
  if (!json)
    return 'Void';

  if (typeof json === 'string')
    return typeMap[json];

  if (json.idlType === 'union')
    return json.members.map(interpretType);

  var name = isObject(json.idlType) ? interpretType(json.idlType) : json.idlType;

  if (name in typeMap)
    name = typeMap[name];

  if (json.sequence)
    name = name+'...';

  if (json.array)
    name = name+'...';

  return name;
}


var definitionTypes = {
  implements: function(json){
    allImplements.push(json);
  },
  typedef: function(json){
    typeMap[json.name] = interpretType(json);
  },
  interface: function(json){
    return new Interface(json);
  },
  exception: function(json){
    return new Exception(json);
  },
  callback: function(json){
    return new Callback(json);
  },
  callbackinterface: function(json){
    return new CallbackInterface(json);
  },
  partialinterface: function(json){
    var iface = new Interface(json);
    if (json.name in allDefinitions)
      iface = merge(iface, allDefinitions[json.name]);
    return iface;
  },
  dictionary: function(json){
    return new Dictionary(json);
  },
  partialdictionary: function(json){
    var dict = new Dictionary(json);
    if (json.name in allDefinitions)
      dict = merge(dict, allDefinitions[json.name]);
    return dict;
  },
  enum: function(json){
    return new Enum(json);
  },
};

var memberTypes = {
  const: function constants(o){
    return isFinite(o.value) ? +o.value : o.value;
  },
  operation: function methods(o){
    return new Operation(o);
  },
  readonly: function readonly(o){
    return interpretType(o.idlType);
  },
  attribute: function properties(o){
    return interpretType(o.idlType);
  },
  accessor: function accessors(o){
    return new Accessor(o);
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
  this.inherits = json.inheritance ? typeof json.inheritance === 'string' ? [json.inheritance] : json.inheritance : [];

  Object(json.members).forEach(function(member){
    if (member.type === 'field')
      member.type = 'readonly';

    if (member.readonly)
      member.type = 'readonly';

    if (!member.name) {
      if (member.stringifier)
        member.name = 'toString';
      else {
        member.type = 'accessor';
        member.name = member[0];
      }
    }

    var type = memberTypes[member.type].name,
        set = this[type] = this[type] || Object.create(null),
        item = memberTypes[member.type](member),
        itemArgs = item.args;

    if (member.name in set && type === 'methods') {
      var existing = set[member.name],
          existingArgs = existing.args = existing.args || {};

      existing.returns = arrayify(existing.returns, item.returns);

      Object.keys(itemArgs).forEach(function(name){
        if (name in existingArgs)
          existingArgs[name] = arrayify(existingArgs[name], itemArgs[name]);
        else
          existingArgs[name] = itemArgs[name];
      });
    } else {
      set[member.name] = item;
    }
  }, this);

  if (this.accessors) {
    void function(){
      var type = {
        index: false,
        key: false
      };
      var actions = {
        deleter: false,
        getter: false,
        setter: false,
        creator: false,
        legacycaller: false
      };
      var itemTypes = {};
      for (var k in this.accessors) {
        if (k === 'legacycaller') {
          this.legacyCaller = this.accessors[k];
          if (Object.keys(this.accessors) === 1)
            return;
        }
        actions[k] = true;
        if ('accessedBy' in this.accessors[k])
          type[this.accessors[k].accessedBy] = true;
        if ('itemType' in this.accessors[k])
          itemTypes[this.accessors[k].itemType] = true;
      }
      itemTypes = Object.keys(itemTypes);
      if (itemTypes.length === 1)
        itemTypes = itemTypes[0];

      for (var k in type) {
        if (type[k]) {
          var accessor = this[k + 'ed'] = {
            itemType: itemTypes,
          };
          if (actions.setter || actions.deleter || actions.creator) {
            if (actions.setter)
              accessor.writable = true;
            if (actions.deleter)
              accessor.deletable = true
            if (actions.creator)
              accessor.creatable = true;
          } else {
            accessor.readonly = true;
          }

        }
      }
      delete this.accessors;
    }.call(this);
  }

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
      } else if (attr.name === 'Supplemental') {
      } else {
        self[attr.name] = attr;
        delete attr.name
      }
    });
  }
}

Interface.prototype = new Definition('interface');

function uncoerce(type, value){
  if (value === 'null')
    return null;
  switch (type) {
    case 'String':
      return value;
    case 'StringArray':
      return value || [];
    case 'Boolean':
      return value === 'true';
    case 'Object':
      return value || {};
    case 'Int8':
    case 'Int16':
    case 'Int32':
    case 'Uint8':
    case 'Uint16':
    case 'Uint32':
      return ~~value;
    case 'Float32':
    case 'Float64':
      return +value || 0;
    default:
      return value === 'null' ? null : value;
  }
}


function Dictionary(json){
  this.type = 'dictionary';
  hidden(this, 'name', json.name);
  this.inherits = json.inheritance ? typeof json.inheritance === 'string' ? [json.inheritance] : json.inheritance : [];
  var defaults = this.defaults = {};
  json.members.forEach(function(member){
    defaults[member.name] = uncoerce(interpretType(member.type), member.defaultValue);
  });
}

Dictionary.prototype = new Definition('dictionary');



function Enum(json){
  this.type = 'enum';
  hidden(this, 'name', json.name);
  this.values = json.values;
}

Enum.prototype = new Definition('enum');



function Exception(json){
  Interface.call(this, json);
  this.type = 'exception';
}

Exception.prototype = new Definition('exception');

function CallbackInterface(json){
  Interface.call(this, json);
  this.type = 'callbackinterface';
}

CallbackInterface.prototype = Object.create(Interface.prototype);



function Operation(json){
  hidden(this, 'name', json.name);
  var t = interpretType(json.idlType);
  if (t !== 'Void')
    this.returns = t;
  var args = {};
  if (isObject(json.arguments)) {
    json.arguments.forEach(function(s){
      args[s.name] = interpretType(s.type);
    });
  }
  if (Object.keys(args).length)
    this.args = args;
  if (json.extAttrs) {
    json.extAttrs.forEach(function(attr){
      if (Object.keys(attr).length === 1 && attr.name) {
        this[attr.name] = true;
      } else {
        this[attr.name] = attr;
        delete attr.name
      }
    }, this);
  }
}


function Callback(json){
  this.type = 'callback';
  Operation.call(this, json);
}

Callback.prototype = Object.create(Operation.prototype);



function Accessor(json){
  var type = interpretType(json.idlType);


  if (isObject(json.arguments) && json.arguments.length) {
    json.arguments.forEach(function(arg){
      this[arg.name] = interpretType(arg.type);
    }, this.args = {});
    if (this.args.index) {
      this.accessedBy = 'index';
      delete this.args.index;
    } else if (this.args.name) {
      this.accessedBy = 'key';
      delete this.args.name;
    }
  }


  switch (json.name) {
    case 'getter':
      this.itemType = type;
      break;
    case 'setter':
    case 'creator':
      var keyname = Object.keys(this.args)[0];
      this.itemType = this.args[keyname];
      delete this.args[keyname];
      break;
  }
  if (!Object.keys(Object(this.args)).length)
    delete this.args;

  if (json.extAttrs)
    merge(json.extAttrs, this);
}

Accessor.prototype = Object.create(Operation.prototype);


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

  function save(state, json){
    var name = path.basename(state.name).slice(0, -path.extname(state.name).length)+'.json';
    saveJSON(state.out, name, json);
  }
];

function saveJSON(folder, name, json){
  fs.writeFileSync(path.resolve(folder, name), JSON.stringify(sort(json), null, ' '));
}

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


