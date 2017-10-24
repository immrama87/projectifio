var SchemaGenerator = (function(){
  var sg = {};

  sg.Builder = function(){
    var b = {};
    var schema = {
      type: "object",
      properties: {
        responseDetails: {
          type: "object",
          properties: {
            errors: {
              type: "array",
              items: {type: "string"}
            },
            values: {
              properties: {
                invalid: {
                  type: "array",
                  items: {type: "string"}
                },
                invalidOpt: {
                  type: "array",
                  items: {type: "string"}
                },
                missing: {
                  type: "array",
                  items: {type: "string"}
                }
              },
              required: ["invalid", "invalidOpt", "missing"]
            },
            warnings: {type: "array"}
          },
          required: ["errors", "values", "warnings"]
        }
      },
      required: ["responseDetails"]
    };

    b.addProperty = function(name, property, required){
      schema.properties[name] = property;

      if(required)
        schema.required.push(name);
    }

    b.build = function(){return schema;}

    return b;
  }

  return sg;
});

module.exports = SchemaGenerator;
