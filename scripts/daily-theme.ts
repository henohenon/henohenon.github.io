/**
 * daily-theme.ts
 *
 * 毎時 (PC 起動中のみ) 呼ばれる想定の冪等ランナー。
 * 「今日 (JST) まだ theme 更新コミットが無ければ」生成して push する。
 *
 * 判定はコミットベース。段階ロジック:
 *   1. origin/main に今日の chore(theme) コミットあり  → 何もしない (= デプロイ済み)
 *   2. ローカル main に今日の chore(theme) コミットあり (未 push) → push だけ (再生成しない)
 *   3. どちらも無し → bun run generate-theme (= 生成 + commit) → push
 *
 * commit は generate-theme が行い、push は当スクリプトが行う (commit/push 分離)。
 * これにより「生成 + commit は済んだが push だけ失敗」した日は、次回 (段階 2) が
 * 再生成せず push だけ再試行できる。
 *
 * scheduler 非依存。Windows タスクスケジューラ / mac launchd どちらからでも叩ける
 * (OS 依存は run-daily-theme.ps1 等のラッパ側に隔離する)。
 *
 * usage:
 *   bun run scripts/daily-theme.ts          実行 (本番)
 *   bun run scripts/daily-theme.ts --check  判定だけ表示 (生成/commit/push しない)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const REPO = path.resolve(import.meta.dir, "..");
const CHECK_ONLY = process.argv.includes("--check");

function log(msg: string): void {
  console.log(`[daily-theme] ${msg}`);
}

/** git をリポジトリ上で実行し結果を返す (stdout/stderr をキャプチャ) */
function git(args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync("git", ["-C", REPO, ...args], { encoding: "utf8" });
  return { code: r.status ?? 1, out: r.stdout ?? "", err: r.stderr ?? "" };
}

/** git を実行し、出力を端末にそのまま流す (push 等の進捗を見せたい場面) */
function gitInherit(args: string[]): number {
  const r = spawnSync("git", ["-C", REPO, ...args], { stdio: "inherit" });
  return r.status ?? 1;
}

/** JST の「今日」(yyyy-MM-dd) と、その 0 時を表す ISO 文字列 (+09:00) */
function todayJst(): { date: string; sinceIso: string } {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const date = jst.toISOString().slice(0, 10);
  return { date, sinceIso: `${date}T00:00:00+09:00` };
}

/**
 * ローカル main を origin/main へ fast-forward で前進させる (ff できなければ何もしない)。
 *
 * 別マシン等で origin/main が進んでいると、生成コミットを古い土台の上に積んでしまい
 * push が non-ff で弾かれ続ける (段階 2 が毎回 reject される無限ループ) ことがある。
 * 生成 / push の前に最新へ追従させておくことで、push を確実に fast-forward にする。
 *
 * - ローカルが既に先行 (未 push の theme コミットあり) なら origin/main は祖先なので no-op。
 * - 真に分岐している / 作業ツリーに衝突する変更がある場合は ff できず、ログだけ出して続行
 *   (履歴を勝手に rebase/merge はしない — 安全側に倒す)。
 */
function fastForwardToOrigin(): void {
  const r = git(["merge", "--ff-only", "origin/main"]);
  if (r.code === 0) {
    log("ローカル main は origin/main に追従済み (ff または既に最新)");
  } else {
    log(`note: ff-only できず続行 (分岐 or ローカル変更あり): ${r.err.trim() || r.out.trim()}`);
  }
}

/** ref に「今日以降の chore(theme): コミット」が在るか */
function hasTodayThemeCommit(ref: string, sinceIso: string): boolean {
  const r = git([
    "log",
    ref,
    `--since=${sinceIso}`,
    "--fixed-strings",
    "--grep=chore(theme):",
    "--format=%H",
  ]);
  if (r.code !== 0) {
    // ref が無い (例: origin/main 未取得) 等。"無い" 扱いにする
    return false;
  }
  return r.out.trim().length > 0;
}

function main(): number {
  const { date, sinceIso } = todayJst();
  log(`today (JST) = ${date}${CHECK_ONLY ? "  [--check: 副作用なし]" : ""}`);

  // 最新の origin/main を取りに行く (オフラインなら警告して続行)
  const fetched = git(["fetch", "origin", "main"]);
  if (fetched.code !== 0) {
    log(`warn: git fetch failed (offline?): ${fetched.err.trim() || fetched.out.trim()}`);
  }

  // 1. リモートに今日の theme コミット → 完了 (ローカルには一切触れない)
  if (hasTodayThemeCommit("origin/main", sinceIso)) {
    log("origin/main に今日の theme コミットあり → 何もしない");
    return 0;
  }

  // ここから先は生成 or push する。事前にローカル main を origin/main へ追従させ、
  // 古い土台の上にコミットして push が non-ff で弾かれ続けるのを防ぐ。
  if (CHECK_ONLY) {
    log("would: git merge --ff-only origin/main");
  } else {
    fastForwardToOrigin();
  }

  // 2. ローカルに今日の theme コミットがあるが未 push → push だけ
  if (hasTodayThemeCommit("main", sinceIso)) {
    log("ローカルに今日の theme コミットあり (未 push) → push のみ");
    if (CHECK_ONLY) {
      log("would: git push origin main");
      return 0;
    }
    return gitInherit(["push", "origin", "main"]);
  }

  // 3. どこにも無い → generate-theme (生成 + commit) → push
  log("今日の theme 更新なし → generate-theme を実行 (生成 + commit)");
  if (CHECK_ONLY) {
    log("would: bun run generate-theme → push");
    return 0;
  }

  // process.execPath = このスクリプトを起動した bun 自身 (= `bun run generate-theme`)。
  // PATH 上の別 bun ではなく必ず同じ bun を使い、env (CLAUDE_BIN 等) も引き継ぐ。
  const gen = spawnSync(process.execPath, ["run", "generate-theme"], {
    cwd: REPO,
    stdio: "inherit",
    env: process.env,
  });
  if ((gen.status ?? 1) !== 0) {
    log(`generate-theme が異常終了 (code=${gen.status})`);
  }

  // generate-theme がコミットを作れていれば push (失敗時はコミットされず差分も残らない)
  if (!hasTodayThemeCommit("main", sinceIso)) {
    log("今日の theme コミットが作られなかった (生成失敗?) → push せず終了");
    return gen.status ?? 1;
  }

  const pushCode = gitInherit(["push", "origin", "main"]);
  if (pushCode !== 0) {
    log("git push 失敗 — コミットは残るので次回 (段階 2) で再 push される");
    return pushCode;
  }
  log("push 完了 → GitHub Pages デプロイへ");
  return 0;
}

process.exitCode = main();
