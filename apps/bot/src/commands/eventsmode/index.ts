import { group } from "disenchantment";

import { hire } from "./hire";
import { profile } from "./profile";
import { list } from "./list";

export const eventmodeGroup = group("eventmode", "eventmode", [
  profile,
  hire,
  list,
]);
