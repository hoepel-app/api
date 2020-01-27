import { RELEASE_ID } from "../../release";

export class Application {
  static release() {
    return { release: RELEASE_ID }
  }
}
