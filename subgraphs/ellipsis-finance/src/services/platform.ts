import { Platform } from "../../generated/schema";
import { ELLIPSIS_PLATFORM_ID } from "../common/constants";

export function getPlatform(): Platform {
  let platform = Platform.load(ELLIPSIS_PLATFORM_ID);
  if (!platform) {
    platform = new Platform(ELLIPSIS_PLATFORM_ID);
  }
  return platform;
}
