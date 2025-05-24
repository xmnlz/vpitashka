import { group } from "disenchantment";

import { hire } from "./hire";
import { profile } from "./profile";

export const eventmodeGroup = group("eventmode", "eventmode", [profile, hire]);
