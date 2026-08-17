// 直近に Focus へ入った Gallery ルート（'/' か '/?ex'）を保持する。
// ※ ex は独立ルートではなく '/' の query モード（transition.ts の markExhibitOrigin が設定）。
// Focus の × の戻り先に使う。直接 /focus/[slug] を開いた場合は既定の '/'。
export const nav = $state({ from: '/' })
