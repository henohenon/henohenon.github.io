// OpenCV.jsがロードされた後に実行される
console.log("OpenCV.js is ready");

const templateImg = document.querySelector("#negi");
const checkImg = document.querySelector("#nakanuki");

const canvas = document.querySelector("#henyahenya");
const ctx = canvas.getContext("2d");

let video;

document.querySelector("a-scene").addEventListener("arReady", () => {
  video = document.querySelector("video");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  check();
});

function captureFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const mat = cv.matFromImageData(imageData);
  return mat;
}
function check() {
  let template = cv.imread("negi");
  let checkImg = captureFrame();
  console.log(checkImg, templateImg);

  console.log(cv);
  // AKAZE特徴量の検出器を作成
  let akaze = cv.AKAZE_create();
  let kp1 = new cv.KeyPointVector();
  let kp2 = new cv.KeyPointVector();
  let des1 = new cv.Mat();
  let des2 = new cv.Mat();

  // 特徴量検出と記述
  akaze.detectAndCompute(template, new cv.Mat(), kp1, des1);
  akaze.detectAndCompute(checkImg, new cv.Mat(), kp2, des2);

  // 特徴量マッチング
  let bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
  let matches = new cv.DMatchVector();
  bf.match(des1, des2, matches);

  // マッチ結果の表示
  let result = new cv.Mat();
  cv.drawMatches(template, kp1, checkImg, kp2, matches, result);
  cv.imshow("outputCanvas", result);

  // 次のフレームを処理
  requestAnimationFrame(check);

  // メモリの解放
  template.delete();
  checkImg.delete();
  kp1.delete();
  kp2.delete();
  des1.delete();
  des2.delete();
  matches.delete();
  result.delete();
}
