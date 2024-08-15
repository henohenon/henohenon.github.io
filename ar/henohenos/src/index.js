import "aframe";
import "mind-ar/dist/mindar-image-aframe.prod.js";

THREE.Vector3.prototype.myProject = function (camera) {
  // カメラのプロジェクション行列を適用
  console.log(camera.matrixWorldInverse);
  const vector = this.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(
    camera.projectionMatrix
  );

  // スクリーン座標に変換
  const x = (vector.x / vector.w) * 0.5 + 0.5;
  const y = (vector.y / vector.w) * 0.5 + 0.5;
  const z = (vector.z / vector.w) * 0.5 + 0.5;

  return new THREE.Vector3(x, y, z);
};
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
  if (results.multiHandLandmarks.length > 0) {
    const handPosition = results.multiHandLandmarks[0][9]; // 手の中央あたりの座標を取得
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

const marker = document.querySelector("#imageTargetar");

async function processFrame() {
  await hands.send({ image: videoElement });

  requestAnimationFrame(processFrame);
}
let count = 0;
function updateArrowDirection(handPosition) {
  // ワールド座標を格納するためのベクターを作成
  var worldPosition = new THREE.Vector3();
  let objectPosition = new THREE.Vector3();
  objectPosition.setFromMatrixPosition(marker.object3D.matrixWorld);
  // 2Dスクリーン座標に変換（キャンバスのサイズに基づく）
  const imageX = (worldPosition.x * 0.5 + 0.5) * window.innerWidth;
  const imageY = (1 - (worldPosition.y * 0.5 + 0.5)) * window.innerHeight;

  const handX = window.innerWidth * handPosition.x;
  const handY = window.innerHeight * handPosition.y;

  handElem.style.left = handX;
  handElem.style.top = handY;

  const angleInDegrees = calculateAngle(imageX, imageY, handX, handY);

  console.log(angleInDegrees);
  count++;
  modelElem.setAttribute("rotation", `0 0 ${angleInDegrees * -1 - 90}`);

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
