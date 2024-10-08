console.log("qrloader/index.js");
const video = document.getElementById("video");
const cameraCanvas = document.getElementById("videoCanvas");
const arCanvas = document.getElementById("arCanvas");
const context = cameraCanvas.getContext("2d", { willReadFrequently: true });

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
  video.play();
});
const loader = new THREE.GLTFLoader();

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
  loader.load(
    "./henobero-ilust.glb",
    function (gltf) {
      const model = gltf.scene;
      //scene.add(model);
      //model.position.set(0, 0, 0);
      console.log("model", model);
      myThree.addMesh(model);
    },
    undefined,
    function (error) {
      console.error(error);
    }
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
      topRightCorner.x, topRightCorner.y, // 右上
      topLeftCorner.x, topLeftCorner.y, // 左上
      bottomLeftCorner.x, bottomLeftCorner.y, // 左下
      bottomRightCorner.x, bottomRightCorner.y, // 右下
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
    this.threeDPoints = [
      -1, 1, 0, // 右上
      1, 1, 0, // 左上
      1, -1, 0, // 左下
      -1, -1, 0, // 右下
    ];
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
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0); // 背景色を透明に設定
    this.renderer.setSize(canvas.width, canvas.height);
    const geometry = new THREE.BoxGeometry(2, 2, 2); // 2x2x2の立方体
    this.mesh = new THREE.Object3D(); //new THREE.Mesh(geometry);
    this.scene.add(this.mesh);
    this.camera.position.z = 5;
    const light = new THREE.DirectionalLight(0xffffff, 1);
    this.scene.add(light);
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
    
    // threejsとopencvの座標系の違いを補正。なんか補正できりゃぁ一番なんだがうまくいかんしこっちでもそんなパフォーマンス悪くないと思うのでパワー
    const xAxis = new THREE.Vector3(1, 0, 0); // x軸
    const quaternionX = new THREE.Quaternion().setFromAxisAngle(
      xAxis,
      THREE.Math.degToRad(90)
    );
    const zAxis = new THREE.Vector3(0, 1, 0); // y軸
    const quaternionZ = new THREE.Quaternion().setFromAxisAngle(
      zAxis,
      THREE.Math.degToRad(180)
    );
    // クォータニオンを乗算
    quaternion.multiply(quaternionX).multiply(quaternionZ);

  
    this.mesh.setRotationFromQuaternion(quaternion);

    this.renderer.render(this.scene, this.camera);
  }

  addMesh(addMesh) {
    this.mesh.add(addMesh);
    // TODO: モデル側で調整
    addMesh.scale.set(0.1, 0.1, 0.1);
    addMesh.position.set(0, 0, 1);
  }
}
