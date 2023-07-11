import * as VerseThree from "@verseengine/verse-three";
const VERSE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@verseengine/verse-three@1.0.6/dist/verse_core_bg.wasm";
const ENTRANCE_SERVER_URL = "https://entrance.verseengine.cloud";
const ANIMATION_MAP = {
  idle: "/examples/asset/animation/idle.fbx",
  walk: "/examples/asset/animation/walk.fbx",
};
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
const range = (n) => [...Array(n).keys()];
export const PRESET_AVATARS = [
  ...range(3).map((i) => `f${i}`),
  ...range(3).map((i) => `m${i}`),
].map((n) => ({
  thumbnailURL: `/examples/asset/avatar/${n}.png`,
  avatarURL: `/examples/asset/avatar/${n}.vrm`,
}));
const DEFAULT_AVATAR_URL =
  PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].avatarURL;

export const setupVerse = async (
  scene,
  renderer,
  camera,
  cameraContainer,
  player,
  collisionBoxes,
  collisionObjects,
  teleportTargetObjects
) => {
  const adapter = new VerseThree.DefaultEnvAdapter(
    renderer,
    scene,
    camera,
    cameraContainer,
    player,
    () => collisionBoxes,
    () => collisionObjects,
    () => teleportTargetObjects,
    {
      isLowSpecMode: true,
    }
  );
  const mayBeLowSpecDevice = VerseThree.isLowSpecDevice();
  const res = await VerseThree.start(
    adapter,
    scene,
    VERSE_WASM_URL,
    ENTRANCE_SERVER_URL,
    DEFAULT_AVATAR_URL,
    ANIMATION_MAP,
    ICE_SERVERS,
    {
      maxNumberOfPeople: mayBeLowSpecDevice ? 8 : 16,
      maxNumberOfParallelFileTransfers: mayBeLowSpecDevice ? 1 : 4,
      presetAvatars: PRESET_AVATARS,
    }
  );
  return { ...res, adapter };
};
