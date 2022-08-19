import createSchema from "part:@sanity/base/schema-creator";
import schemaTypes from "all:part:@sanity/base/schema-type";

import collection from "./collection";
import Creator from "./creator";

export default createSchema({
  name: "default",
  types: schemaTypes.concat([collection, Creator]),
});
