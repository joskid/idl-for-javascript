# IDL for JavaScript
The purpose of this project is simply to provide IDL definitions to JavaScript in a JavaScript friendly manner. IDL is converted to JSON, types are normalized to their JavaScript counterpart, and definitions are flattened down from multiple "implements", etc. The result is something that's actually usable and useful directly in JavaScript.

![screenshot](https://raw.github.com/Benvie/idl-for-javascript/master/ss.png)


# Usage
For regular usage, simply use the specific json files needed. If using from Node.js, install this module:

    npm install idl4js

A function for each json file is exported that will load it for you.

```javascript
var html5 = require('idl4js').html5(),
    dom4 = require('id4js').dom4();
```


# Schema

At the top level is the definition type. The vast majority of definitions are __interfaces__. A handful are __dictionaries__ which are exclusively used for initializing event objects. A smaller handful are enums.

* __type__: one of ["interface", "dictionary", "exception", "enum", "callback"]
* __inherits__: an array containing the names that the item inherits from. Items in idl can have multiple inheritance which is manifested in JavaScript as a flattening of all but the primary one together onto the prototype.
* __readonly__: a list of attributes that instances have which can't be changed from JavaScript. List as a dict of name -> type.
* __methods__: a list of methods that appear on the prototype. Methods can have the following:
    * __returns__: the type of value returned. If missing then the method doesn't return anything.
    * __args__: a list of arguments by name -> type, in order.
* __properties__: a list of mutable properties by name -> type
* __constants__: A list of constant names and their values.
* __defaults__: For dictionaries, a list of dictionary members and their default values
* __indexed__: if an item is `indexed` then it will have numbered properties, an "item" method, and a length. The type of value is indicated, as well as whether the items are writable, deletable, and creatable.
* __keyed__: similar to indexed, except the items are named instead of indexed. CSS properties are an example of this.
* __construct__: if an item is constructable via `new` in JavaScript then it will have this property, which includes the name of the constructor and args.

__Arrays of items__ are listed with '...' after their name. This indicates that JavaScript Array type is either accepted or returned as opposed to some DOM Collection type.

__Multiple accepted types__ in args lists are indicated as arrays.

# Example
An abbreviated version of `Window`:
```json
{
  "Window": {
    "type": "interface",
    "inherits": ["EventTarget"],
    "readonly": {
      "window": "Window",
      "self": "Window"
    },
    "properties": {
      "name": "String",
      "status": "String",
      "opener": "Window",
      "onabort": "EventHandler",
    },
    "methods": {
      "close": {},
      "stop": {},
      "open": {
        "returns": "Window",
        "args": {
          "url": "String",
          "target": "String",
          "features": "String",
          "replace": "Boolean"
        }
      },
      "setTimeout": {
        "returns": "Int32",
        "args": {
          "handler": ["Function", "String"],
          "timeout": "Int32",
          "arguments": "Any"
        }
      },
      "clearTimeout": {
        "args": {
          "handle": "Int32"
        }
      }
    }
  }
}
```

# Included
* [css](http://www.w3.org/TR/DOM-Level-2-Style/idl/css.idl)
* [cssomvalues](http://dev.w3.org/csswg/cssom-values/)
* [cssomview](http://www.w3.org/TR/cssom-view/)
* [dom2](http://www.w3.org/TR/DOM-Level-2-Core/idl/dom.idl)
* [dom3](http://www.w3.org/TR/DOM-Level-3-Core/idl/dom.idl)
* [dom4](http://dom.spec.whatwg.org/)
* [events](http://www.w3.org/TR/DOM-Level-2-Events/idl/events.idl)
* [fileapi](http://www.w3.org/TR/FileAPI/)
* [filesystem](http://www.w3.org/TR/file-system-api)
* [html2](http://www.w3.org/TR/DOM-Level-2-HTML/idl/html2.idl)
* [html5](http://www.whatwg.org/specs/web-apps/current-work)
* [idb](http://www.w3.org/TR/IndexedDB/)
* [smil](http://www.w3.org/TR/2000/WD-smil-boston-dom-20000225/idl/smil.idl)
* [svg](http://www.w3.org/TR/2011/REC-SVG11-20110816/svg.idl)
* [traversal](http://www.w3.org/TR/DOM-Level-2-Traversal-Range/idl/traversal.idl)
* [typedarray](https://www.khronos.org/registry/typedarray/specs/latest/typedarray.idl)
* [views](http://www.w3.org/TR/DOM-Level-2-Views/idl/views.idl)
* [webrtc](http://www.w3.org/TR/webrtc)
* [webgl](https://www.khronos.org/registry/webgl/specs/latest/webgl.idl)

html5 also includes a few extras like ShadowDOM and XHR
