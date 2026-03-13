/**
 * lean script 框架导出
 * 在项目根目录package.json中添加依赖：
 * "dependencies": {
 *     "lsscript": "file:assets/lsscript"
 * }
 * 在根tsconfig.json中设置Node.js解析规则：
 * "moduleResolution": "node"，
 */

//core
export { AnimFa, AnimSp, AnimTw } from "./core/AnimMgr";
export { AudioMgr } from "./core/AudioMgr";
export { BindUI } from "./core/BindUI";
export { Btn } from "./core/BtnMgr";
export { Events } from "./core/EventMgr";
export { httpGet, httpPost } from "./core/HttpMgr";
export { NCountFn, NTime, NWs } from "./core/NMgr";
export { ResLoad } from "./core/ResMgr";
export { Tools } from "./core/ToolsMgr";

//game
export { BaseComponent } from "./core/game/BaseComponent";
export { eventsOnLoad, preloadEvent } from "./core/game/BaseDescriptor";
export { GAudio } from "./core/game/GAudio";
export { GEventName } from "./core/game/GEventsName";
export { LangLabel } from "./core/game/lang/LangLabel";
export { LangMgr } from "./core/game/lang/LangMgr";
export { LangSprite } from "./core/game/lang/LangSprite";

//global
export { GG } from "./GGlobal";
export { lsGameData } from "./GameData";
