# IDL for JavaScript

The purpose of this project is simply to provide IDL definitions to JavaScript in a JavaScript friendly manner. These definitions are incredibly important to JavaScript in that they are the interface that is provided to it, yet up until now it's been nearly impossible to actually get this information into JavaScript outside from the resulting interfaces created from these IDLs.

# Usage

Use the .json files in the json directory.

Provided is all the ingrediants required to actually convert IDLs into usable JSON. This allows you to tweak the generation as you see fit. Beyond that, the actual resulting JSON is provided so for most usages simply loading the pre-created JSON is all you need. What you do with it is up to you.

# Schema

At the top level is the definition type. The vast majority of definitions are __interfaces__. A handful are __dictionaries__ which are exclusively used for initializing event objects. A smaller handful are enums.

* __type__: one of ["interface", "dictionary", "exception", "enum", "callback"]
* __ inherits__: an array containing the names that the item inherits from. Items in idl can have multiple inheritance which is manifested in JavaScript as a flattening of all but the primary one together onto the prototype.
* __readonly__: a list of attributes that instances have which can't be changed from JavaScript. List as a dict of name -> type.
* __methods__: a list of methods that appear on the prototype. Methods can have the following:
    * __returns__: the type of value returned. If missing then the method doesn't return anything.
    * __args__: a list of arguments by name -> type, in order.
* __properties__: a list of mutable properties by name -> type
* __indexed__: if an item is `indexed` then it will have numbered properties, an "item" method, and a length. The type of value is indicated, as well as whether the items are writable, deletable, and creatable.
* __keyed__: similar to indexed, except the items are named instead of indexed. CSS properties are an example of this.
* __construct__: if an item is constructable via `new` in JavaScript then it will have this property, which includes the name of the constructor and args.



# Extra

`converter.js` includes some very simply utilities for automated handling of the basic types provided.

# Included

All of these have been slightly modified to parse correctly by the web.idl parser. The URL where these originated can be found in sources.json.

* [css](http://www.w3.org/TR/DOM-Level-2-Style/idl/css.idl)
* [cssomview](http://www.w3.org/TR/cssom-view/)
* [dom2](http://www.w3.org/TR/DOM-Level-2-Core/idl/dom.idl)
* [dom3](http://www.w3.org/TR/DOM-Level-3-Core/idl/dom.idl)
* [events](http://www.w3.org/TR/DOM-Level-2-Events/idl/events.idl)
* [fileapi](http://www.w3.org/TR/FileAPI/)
* [filesystem](http://www.w3.org/TR/file-system-api)
* [html2](http://www.w3.org/TR/DOM-Level-2-HTML/idl/html2.idl)
* [idb](http://www.w3.org/TR/IndexedDB/)
* [ranges](http://www.w3.org/TR/DOM-Level-2-Traversal-Range/idl/ranges.idl)
* [smil](http://www.w3.org/TR/2000/WD-smil-boston-dom-20000225/idl/smil.idl)
* [stylesheets](http://www.w3.org/TR/2000/REC-DOM-Level-2-Style-20001113/idl/stylesheets.idl)
* [svg](http://www.w3.org/TR/2011/REC-SVG11-20110816/svg.idl)
* [traversal](http://www.w3.org/TR/DOM-Level-2-Traversal-Range/idl/traversal.idl)
* [typedarray](https://www.khronos.org/registry/typedarray/specs/latest/typedarray.idl)
* [views](http://www.w3.org/TR/DOM-Level-2-Views/idl/views.idl)
* [webrtc](http://www.w3.org/TR/webrtc)
* [webgl](https://www.khronos.org/registry/webgl/specs/latest/webgl.idl)
* [whatwg-dom](http://dom.spec.whatwg.org/)
* [whatwg-html5](http://www.whatwg.org/specs/web-apps/current-work)
