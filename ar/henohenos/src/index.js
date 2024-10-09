import "aframe";
import "aframe-extras";
import "mind-ar/dist/mindar-image-aframe.prod.js";
//const videoElement = document.createElement('a-canvas');
console.log(Hands);
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

hands.onResults((results) => {
  if (neckBone == null) return;
  if (results.multiHandLandmarks.length > 0) {
    const handPosition = results.multiHandLandmarks[0][8]; // 手の中央あたりの座標を取得
    updateArrowDirection(handPosition);
  }
});

let videoElement = null;
document.querySelector("a-scene").addEventListener("arReady", () => {
  videoElement = document.querySelector("video");

  requestAnimationFrame(processFrame);
});

const handElem = document.getElementById("hand");
const modelElem = document.querySelector("#berus");
let neckBone = null;
let idealNeckRotation;

modelElem.addEventListener("model-loaded", (e) => {
  const model = e.detail.model;
  modelElem.setAttribute("animation-mixer", "clip: ideal; loop: once;");
  const skinnedMesh = model.getObjectByProperty("type", "SkinnedMesh");
  neckBone = skinnedMesh.skeleton.getBoneByName("neck"); // ボーン名で取得
  idealNeckRotation = new THREE.Vector3(
    neckBone.rotation.x,
    neckBone.rotation.y,
    neckBone.rotation.z
  );
});

const marker = document.querySelector("#imageTargetar");
let motionTimer = null;
let isFirst = true;
let isFounding = false;

marker.addEventListener("targetFound", (e) => {
  if (isFirst) {
    isFirst = false;
  }
  isFounding = true;
  RandomHowling();
});

function RandomHowling() {
  const randomTime = Math.floor(Math.random() * 3000) + 10000;

  motionTimer = setTimeout(() => {
    modelElem.setAttribute("animation-mixer", "clip: ideal; loop: once;");
    modelElem.setAttribute("animation-mixer", "clip: howling; loop: once;");
    if (isFounding) {
      RandomHowling();
    }
  }, randomTime);
}

marker.addEventListener("targetLost", (e) => {
  clearTimeout(motionTimer);
  modelElem.setAttribute("animation-mixer", "clip: idle; loop: repeat;");
  isFounding = false;
});

async function processFrame() {
  await hands.send({ image: videoElement });

  requestAnimationFrame(processFrame);
}
function updateArrowDirection(handPosition) {
  console.log(marker.object3D);
  const camera = document.querySelector("a-camera").getObject3D("camera");
  // ワールド座標を格納するためのベクターを作成
  var objectPosition = new THREE.Vector3();
  modelElem.object3D.getWorldPosition(objectPosition);
  objectPosition.project(camera);
  if (objectPosition.x == NaN) return;
  // 2Dスクリーン座標に変換（キャンバスのサイズに基づく）
  const imageX = (objectPosition.x * 0.5 + 0.5) * window.innerWidth;
  const imageY = (1 - (objectPosition.y * 0.5 + 0.5)) * window.innerHeight;

  const handX = window.innerWidth * handPosition.x;
  const handY = window.innerHeight * handPosition.y;

  handElem.style.left = imageX;
  handElem.style.top = imageY;

  const angleInDegrees = calculateAngle(imageX, imageY, handX, handY);

  const xtmp =
    Math.abs(angleInDegrees) > 90
      ? 180 - Math.abs(angleInDegrees)
      : Math.abs(angleInDegrees);
  const xDegress = xtmp * Math.sign(angleInDegrees);
  const yDegress = Math.abs(angleInDegrees) - 90;
  neckBone.rotation.x = idealNeckRotation.x + (Math.PI / 2) * -(yDegress / 135);
  neckBone.rotation.z = idealNeckRotation.z + (Math.PI / 2) * (xDegress / 135);

  //const arrow = document.querySelector('#arrow');
  // 手の位置に基づいて矢印の回転を計算
  //const x = handPosition.x * 2 - 1; // 座標を-1から1の範囲に変換
  //const y = 1 - handPosition.y * 2; // y座標の反転
  //arrow.object3D.lookAt(new THREE.Vector3(x, y, -1));
}

function calculateAngle(x1, y1, x2, y2) {
  let deltaX = x2 - x1;
  let deltaY = y2 - y1;
  let angleInRadians = Math.atan2(deltaY, deltaX);
  let angleInDegrees = angleInRadians * (180 / Math.PI);
  return angleInDegrees;
}
