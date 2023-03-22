import type { Scene } from "aframe";

export function fetchScript(src: string) {
  return new Promise(function (resolve, reject) {
    const script = document.createElement(
      "script"
    ) as HTMLElement as HTMLScriptElement;
    document.body.appendChild(script);
    script.onload = resolve;
    script.onerror = reject;
    script.async = true;
    script.src = src;
  });
}

export async function waitForAframeLoad(scene: Scene): Promise<void> {
  if (scene.hasLoaded) {
    return;
  }
  return new Promise((resolve) =>
    scene.addEventListener("loaded", () => {
      resolve();
    })
  );
}

export async function lazyLoadAframeObjects(scene: Scene): Promise<void> {
  await waitForAframeLoad(scene);

  const dataName = isLowSpecDevice() ? "srcS" : "src";
  // eslint-disable-next-line  no-constant-condition
  for (let i = 0; true; i++) {
    const tmpl = document.querySelector(`#lazy${i}`);
    if (!tmpl) {
      break;
    }
    const html = tmpl.innerHTML;
    const m = html.match(/<\s*a-assets[\s\S]+<\/\s*a-assets\s*>/);
    if (m && m.index !== undefined) {
      const assets = switchSourceForHTML(m[0], dataName);
      const others =
        html.substring(0, m.index) + html.substring(m.index + m[0].length);
      scene.insertAdjacentHTML("beforeend", assets);
      const ar = document.getElementsByTagName("a-assets");
      const assetsEl = ar[ar.length - 1];
      await new Promise((resolve) => {
        assetsEl.addEventListener("loaded", resolve);
        assetsEl.addEventListener("timeout", resolve);
      });
      scene.insertAdjacentHTML("beforeend", others);
    } else {
      scene.insertAdjacentHTML("beforeend", html);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

function switchSourceForHTML(html: string, dataName: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  for (const img of Array.from(
    tmp.querySelectorAll("[data-src]") as NodeListOf<HTMLElement>
  )) {
    const v = img.dataset[dataName];
    if (v) {
      img.setAttribute("src", v);
    }
  }
  return tmp.innerHTML;
}

export function isLowSpecDevice(): boolean {
  const info = getRenderInfo();
  if (!info) {
    return false;
  }
  if (info.vendor === "Qualcomm") {
    return true;
  }
  if (info.vendor.includes("Intel")) {
    if (info.renderer.includes("Iris")) {
      return true;
    }
  }
  if (navigator.userAgent.match("Android")) {
    return true;
  }

  return false;
}
export function getRenderInfo():
  | { vendor: string; renderer: string }
  | undefined {
  try {
    const canvas = document.createElement(
      "canvas"
    ) as HTMLElement as HTMLCanvasElement;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      return;
    }
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) {
      return {
        vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || "",
        renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "",
      };
    }
  } catch (ex) {
    console.warn(ex);
  }
}
