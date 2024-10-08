console.log("qrloader/index.js");
const video = document.getElementById("video");
const cameraCanvas = document.getElementById("videoCanvas");
const arCanvas = document.getElementById("arCanvas");
const context = cameraCanvas.getContext("2d", { willReadFrequently: true });

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
  video.play();
});

let myThree;
let arConverter;

video.addEventListener("loadedmetadata", () => {
  cameraCanvas.width = video.videoWidth;
  cameraCanvas.height = video.videoHeight;
  arCanvas.width = video.videoWidth;
  arCanvas.height = video.videoHeight;

  myThree = new MyThree(arCanvas);
  arConverter = new ARCoordinateTransformer(
    cameraCanvas.width,
    cameraCanvas.height
  );

  qrScan();
});

function qrScan() {
  context.drawImage(video, 0, 0, cameraCanvas.width, cameraCanvas.height);

  // QRコードを読み取る
  const imageData = context.getImageData(
    0,
    0,
    cameraCanvas.width,
    cameraCanvas.height
  );

  const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
  if (qrCode) {
    const {
      topLeftCorner,
      topRightCorner,
      bottomRightCorner,
      bottomLeftCorner,
    } = qrCode.location;

    //console.log("QRコード内容:", qrCode);

    // qrの縁に線を描画する
    drawQRBorder(
      topLeftCorner,
      topRightCorner,
      bottomRightCorner,
      bottomLeftCorner
    );

    // QRコードの座標
    const twoDPoints = [
      topLeftCorner.x,
      topLeftCorner.y,
      topRightCorner.x,
      topRightCorner.y,
      bottomLeftCorner.x,
      bottomLeftCorner.y,
      bottomRightCorner.x,
      bottomRightCorner.y,
    ];

    console.log(arConverter);

    const { rvec, tvec } = arConverter.qrPointsTo3DPoints(twoDPoints);

    // 回転ベクトルと平行移動ベクトルを表示
    console.log("Rotation Vector:", rvec.data64F);
    console.log("Translation Vector:", tvec.data64F);

    // 3D座標を更新
    myThree.update(tvec, rvec);
  }

  requestAnimationFrame(qrScan);
}

function drawQRBorder(
  topLeftCorner,
  topRightCorner,
  bottomRightCorner,
  bottomLeftCorner
) {
  context.strokeStyle = "yellow";

  context.beginPath();
  context.moveTo(topLeftCorner.x, topLeftCorner.y);
  context.lineTo(topRightCorner.x, topRightCorner.y);
  context.lineTo(bottomRightCorner.x, bottomRightCorner.y);
  context.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
  context.closePath();
  context.stroke();
}

class ARCoordinateTransformer {
  threeDPoints;
  fx;
  fy;
  cx;
  cy;
  cameraMatrix;
  distCoeffs;

  constructor(width, height) {
    // 3d座標
    this.threeDPoints = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0];
    this.fx = 300; // 焦点距離の例
    this.fy = 300; // 焦点距離の例
    this.cx = width / 2; // カメラ中心（例）
    this.cy = height / 2; // カメラ中心（例）

    this.cameraMatrix = cv.matFromArray(3, 3, cv.CV_64F, [
      this.fx,
      0,
      this.cx,
      0,
      this.fy,
      this.cy,
      0,
      0,
      1,
    ]);

    // 歪み係数（ゼロに設定）
    this.distCoeffs = cv.Mat.zeros(4, 1, cv.CV_64F);
  }

  qrPointsTo3DPoints(qrPoints) {
    // 変数の初期化
    const rvec = new cv.Mat();
    const tvec = new cv.Mat();

    // SolvePnPでカメラの外部パラメータを推定
    const objectPointsMat = cv.matFromArray(4, 3, cv.CV_32F, this.threeDPoints);

    const imagePointsMat = cv.matFromArray(4, 2, cv.CV_32F, qrPoints);

    cv.solvePnP(
      objectPointsMat,
      imagePointsMat,
      this.cameraMatrix,
      this.distCoeffs,
      rvec,
      tvec
    );

    return { rvec, tvec };
  }
}
class MyThree {
  scene;
  camera;
  renderer;
  mesh;

  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
    });
    this.renderer.setSize(canvas.width, canvas.height);
    const geometry = new THREE.BoxGeometry(2, 2, 2); // 2x2x2の立方体
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
    this.camera.position.z = 5;
  }

  update(tvec, rvec) {
    // Three.jsのカメラに位置ベクトルを適用
    const tvecData = tvec.data64F;
    this.camera.position.set(-tvecData[0], tvecData[1], tvecData[2]);

    // 回転ベクトルを回転行列に変換（Rodrigues変換）
    const rotationMatrix = new cv.Mat();
    cv.Rodrigues(rvec, rotationMatrix); // rvecを回転行列に変換

    const rotationData = rotationMatrix.data64F;

    // Three.jsのカメラに回転行列を適用
    const threeRotationMatrix = new THREE.Matrix4();
    threeRotationMatrix.set(
      rotationData[0],
      -rotationData[1],
      -rotationData[2],
      0,
      -rotationData[3],
      rotationData[4],
      rotationData[5],
      0,
      -rotationData[6],
      rotationData[7],
      rotationData[8],
      0,
      0,
      0,
      0,
      1
    );

    // カメラの姿勢を設定
    const quaternion = new THREE.Quaternion();
    quaternion.setFromRotationMatrix(threeRotationMatrix);
    this.mesh.setRotationFromQuaternion(quaternion);

    // カメラの更新
    this.mesh.updateMatrixWorld();
    this.camera.updateMatrixWorld();

    this.renderer.render(this.scene, this.camera);
  }
}
