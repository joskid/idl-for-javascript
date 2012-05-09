var converters = function(global){
  return ['Int8', 'Int16', 'Uint8', 'Uint16', 'Float32'].reduce(function(r, name){
    return r[name].typed = new global[name+'Array'](1), r;
  }, {
    Any: function Any(x){ return x },
    Int8: function Int8(x){ Int8.typed[0] = x; return Int8.typed[0] },
    Int16: function Int16(x){ Int16.typed[0] = x; return Int16.typed[0] },
    Int32: function Int32(x){ x >> 0 },
    Uint8: function Uint8(x){ Uint8.typed[0] = x; return Uint8.typed[0] },
    Uint16: function Uint16(x){ Uint16.typed[0] = x; return Uint16.typed[0] },
    Uint32: function Uint32(x){ x >>> 0 },
    Float32: function Float32(x){ Float32.typed[0] = x; return Float32.typed[0] },
    Float64: function Float64(x){ return +x || 0; },
  });
}(new Function('return this')());

console.log(converters);