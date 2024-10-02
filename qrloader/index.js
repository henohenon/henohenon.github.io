console.log("qrloader/index.js");
const video = document.getElementById("video");
const cameraCanvas = document.getElementById("videoCanvas");
const arCanvas = document.getElementById("arCanvas");
const context = cameraCanvas.getContext("2d", { willReadFrequently: true });

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
  video.play();
});

//let threeScene;
let mesh;
let renderer;
let scene;
let camera;
let vertices;
let geometry;

video.addEventListener("loadedmetadata", () => {
  cameraCanvas.width = video.videoWidth;
  cameraCanvas.height = video.videoHeight;
  arCanvas.width = video.videoWidth;
  arCanvas.height = video.videoHeight;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    cameraCanvas.width / cameraCanvas.height,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({
    canvas: arCanvas,
  });
  renderer.setSize(cameraCanvas.width, cameraCanvas.height);
  geometry = new THREE.BoxGeometry(2, 2, 2); // 2x2x2の立方体
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  camera.position.z = 5;

  //console.log(geometry.attributes.position.array);

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

  // カメラの中心に十字を描画
  context.strokeStyle = "white";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(cameraCanvas.width / 2, 0);
  context.lineTo(cameraCanvas.width / 2, cameraCanvas.height);
  context.moveTo(0, cameraCanvas.height / 2);
  context.lineTo(cameraCanvas.width, cameraCanvas.height / 2);
  context.lineWidth = 2;
  context.moveTo(cameraCanvas.width / 4, 0);
  context.lineTo(cameraCanvas.width / 4, cameraCanvas.height);
  context.stroke();

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
    context.strokeStyle = "yellow";

    context.beginPath();
    context.moveTo(topLeftCorner.x, topLeftCorner.y);
    context.lineTo(topRightCorner.x, topRightCorner.y);
    context.lineTo(bottomRightCorner.x, bottomRightCorner.y);
    context.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
    context.closePath();
    context.stroke();
    const chWidth = cameraCanvas.width / 2;
    const chHeight = cameraCanvas.height / 2;
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
    // 3d座標
    const threeDPoints = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0];

    const fx = 300; // 焦点距離の例
    const fy = 300; // 焦点距離の例
    const cx = chWidth; // カメラ中心（例）
    const cy = chHeight; // カメラ中心（例）

    const cameraMatrix = cv.matFromArray(3, 3, cv.CV_64F, [
      fx,
      0,
      cx,
      0,
      fy,
      cy,
      0,
      0,
      1,
    ]);

    // 歪み係数（ゼロに設定）
    const distCoeffs = cv.Mat.zeros(4, 1, cv.CV_64F);

    // 変数の初期化
    const rvec = new cv.Mat();
    const tvec = new cv.Mat();

    // SolvePnPでカメラの外部パラメータを推定
    const objectPointsMat = cv.matFromArray(4, 3, cv.CV_32F, threeDPoints);

    const imagePointsMat = cv.matFromArray(4, 2, cv.CV_32F, twoDPoints);

    cv.solvePnP(
      objectPointsMat,
      imagePointsMat,
      cameraMatrix,
      distCoeffs,
      rvec,
      tvec
    );

    // 回転ベクトルと平行移動ベクトルを表示
    console.log("Rotation Vector:", rvec.data64F);
    console.log("Translation Vector:", tvec.data64F);

    // 回転ベクトルを回転行列に変換（Rodrigues変換）
    const rotationMatrix = new cv.Mat();
    cv.Rodrigues(rvec, rotationMatrix); // rvecを回転行列に変換

    // Three.jsのカメラに回転行列を適用
    const threeRotationMatrix = new THREE.Matrix4();
    threeRotationMatrix.set(
      rotationMatrix.data64F[0],
      -rotationMatrix.data64F[1],
      -rotationMatrix.data64F[2],
      0,
      -rotationMatrix.data64F[3],
      rotationMatrix.data64F[4],
      rotationMatrix.data64F[5],
      0,
      -rotationMatrix.data64F[6],
      rotationMatrix.data64F[7],
      rotationMatrix.data64F[8],
      0,
      0,
      0,
      0,
      1
    );

    /*
          rotationMatrix.makeRotationFromEuler(
        new THREE.Euler(
          rotationVector.x,
          rotationVector.y,
          rotationVector.z,
          "XYZ"
        )
      )

    */
    camera.position.set(-tvec.data64F[0], tvec.data64F[1], tvec.data64F[2]);

    const quaternion = new THREE.Quaternion();
    quaternion.setFromRotationMatrix(threeRotationMatrix);
    mesh.setRotationFromQuaternion(quaternion);

    // カメラの更新
    mesh.updateMatrixWorld();
    camera.updateMatrixWorld();

    renderer.render(scene, camera);
  }

  requestAnimationFrame(qrScan);
}
