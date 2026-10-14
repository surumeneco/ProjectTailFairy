/**
 * 恒常性モジュールの公開情報です。
 */

//#region 公開定数

const MODULE_VERSION = "0.1.0";

export const homeostasis_module = {
  name: "homeostasis",
  version: MODULE_VERSION
};

//#endregion

//#region 恒常性の基礎演算

export { updateFiringRate, updateThreshold } from "./Homeostasis";

//#endregion
