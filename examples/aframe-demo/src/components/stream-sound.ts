import type { AFrame, Entity, DetailEvent } from "aframe";
import type * as threeTypes from "three";
declare const AFRAME: AFrame;
declare const THREE: typeof threeTypes;

AFRAME.registerComponent("stream-sound", {
  _media: undefined as HTMLAudioElement | undefined,
  _audio: undefined as THREE.PositionalAudio | undefined,
  _audioListener: undefined as THREE.AudioListener | undefined,
  schema: {
    src: { type: "audio" },
    volume: { default: 1 },
    distanceModel: {
      default: "inverse",
      oneOf: ["linear", "inverse", "exponential"],
    },
    maxDistance: { default: 10000 },
    refDistance: { default: 1 },
    rolloffFactor: { default: 1 },
  },
  playSound() {
    if (!this._audioListener) {
      return;
    }
    const audio = this._audio || new THREE.PositionalAudio(this._audioListener);
    if (!this._audio) {
      this._audio = audio;
      this.el.setObject3D("audio", audio);
    }
    this._updateData();

    const media = this._media || new Audio(this.data.src);
    if (!this._media) {
      this._media = media;
      media.crossOrigin = "anonymous";
    }
    this._audio.setMediaElementSource(media);
    this._media.volume = this.data.volume;
    this._media.muted = !this.data.volume;
    this._media.play();
  },
  update(oldData) {
    const data = this.data;
    const src = data.src;
    if (!src) {
      this._stop();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sceneEl = this.el.sceneEl as any;
    const audioListener = sceneEl.audioListener || new THREE.AudioListener();
    this._audioListener = audioListener;
    sceneEl.audioListener = audioListener;
    if (sceneEl.camera) {
      if (
        !sceneEl.camera.children.find(
          (v: THREE.Object3D) => v instanceof THREE.AudioListener
        )
      ) {
        sceneEl.camera.add(sceneEl.audioListener);
      }
    } else {
      sceneEl.addEventListener(
        "camera-set-active",
        function (e: DetailEvent<{ cameraEl: Entity }>) {
          if (
            !sceneEl.camera.children.find(
              (v: THREE.Object3D) => v instanceof THREE.AudioListener
            )
          ) {
            e.detail.cameraEl.getObject3D("camera").add(sceneEl.audioListener);
          }
        }
      );
    }
    this._updateData();

    if (data.src !== oldData.src && this._media) {
      this._media.src = data.src;
    }
  },
  remove: function () {
    this._stop();
  },
  _stop: function () {
    const audio = this.el.getObject3D("audio") as THREE.PositionalAudio;
    audio?.disconnect();
    audio?.removeFromParent();
  },
  _updateData() {
    const data = this.data;
    if (this._audio) {
      const audio = this._audio;
      audio.setDistanceModel(data.distanceModel);
      audio.setMaxDistance(data.maxDistance);
      audio.setRefDistance(data.refDistance);
      audio.setRolloffFactor(data.rolloffFactor);
      // audio.setVolume(data.volume);
    }
    // In Safari, playback with Web Audio API of stream audio fails and it is played from AudioElement.
    // It is necessary to set the volume in AudioElement instead of GainNode.
    if (this._media) {
      this._media.volume = this.data.volume;
      this._media.muted = !this.data.volume;
      if (!this._media.muted) {
        this._media.play();
      } else {
        this._media.pause();
      }
    }
  },
});
