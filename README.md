# IDL for JavaScript

The purpose of this project is simply to provide IDL definitions to JavaScript in a JavaScript friendly manner. These definitions are incredibly important to JavaScript in that they are the interface that is provided to it, yet up until now it's been nearly impossible to actually get this information into JavaScript outside from the resulting interfaces created from these IDLs.

# Usage

Use the .json files in the json directory.

Provided is all the ingrediants required to actually convert IDLs into usable JSON. This allows you to tweak the generation as you see fit. Beyond that, the actual resulting JSON is provided so for most usages simply loading the pre-created JSON is all you need. What you do with it is up to you.

# Schema

At the top level is the definition type. The vast majority of definitions are __interfaces__. A handful are __dictionaries__ which are exclusively used for initializing event objects. A smaller handful are enums.

# Extra

`converters.js` includes some very simply utilities for automated handling of the basic types provided.

# Included

All of these have been slightly modified to parse correctly by the web.idl parser. The URL where these originated can be found in sources.json.

* css.idl
* cssomview.idl
* dom2.idl
* dom3.idl
* events.idl
* html2.idl
* html5.idl
* smil.idl
* svg.idl
* traversal.idl
* views.idl
* xhr.idl
