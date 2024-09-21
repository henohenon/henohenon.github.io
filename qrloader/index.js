console.log("qrloader/index.js");
const video = document.getElementById("video");
const cameraCanvas = document.getElementById("videoCanvas");
const arCanvas = document.getElementById("arCanvas");
const context = cameraCanvas.getContext("2d");

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
  video.play();
});

let threeScene;

video.addEventListener("loadedmetadata", () => {
  cameraCanvas.width = video.videoWidth;
  cameraCanvas.height = video.videoHeight;
  arCanvas.width = video.videoWidth;
  arCanvas.height = video.videoHeight;
  threeScene = new ThreeScene(arCanvas, video.videoWidth, video.videoHeight);
  //threeInit(video.videoWidth, video.videoHeight);
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

    console.log("QRコード内容:", qrCode);

    // 赤い線を描画する
    context.strokeStyle = "red";
    context.lineWidth = 3;

    context.beginPath();
    context.moveTo(topLeftCorner.x, topLeftCorner.y);
    context.lineTo(topRightCorner.x, topRightCorner.y);
    context.lineTo(bottomRightCorner.x, bottomRightCorner.y);
    context.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
    context.closePath();
    context.stroke();

    threeScene.changeCamera(
      topLeftCorner,
      topRightCorner,
      bottomRightCorner,
      bottomLeftCorner
    );

    // Three.jsのレンダリング
    threeScene.render();
  }

  requestAnimationFrame(qrScan);
}

class ThreeScene {
  constructor(canvas, width, height) {
    this.width = width;
    this.height = height;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 1000);
    this.camera.position.z = 5;
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
    this.renderer.setSize(width, height);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.plane = new THREE.Mesh(geometry, material);
    this.scene.add(this.plane);
  }

  changeCamera(
    topLeftCorner,
    topRightCorner,
    bottomRightCorner,
    bottomLeftCorner
  ) {
    const centerX =
      (topLeftCorner.x +
        topRightCorner.x +
        bottomRightCorner.x +
        bottomLeftCorner.x) /
      4;
    const centerY =
      (topLeftCorner.y +
        topRightCorner.y +
        bottomRightCorner.y +
        bottomLeftCorner.y) /
      4;

    // 座標変換（キャンバス座標からthree.jsの座標系に変換）
    const normalizedX = (centerX / this.width) * 2 - 1;
    const normalizedY = -(centerY / this.height) * 2 + 1;

    const dx = topLeftCorner.x - topRightCorner.x;

    const rate = Math.abs(dx) / this.width;
    const scale = 1 / rate; // QRコードの幅を計算

    console.log(scale, rate);

    const widthHeightRate = this.width / this.height;

    // カメラの位置と回転をQRコードの中心に合わせる
    this.camera.position.set(
      -normalizedX * scale,
      (-normalizedY * scale) / widthHeightRate,
      scale
    );
    //this.camera.rotation.z = angle;
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
