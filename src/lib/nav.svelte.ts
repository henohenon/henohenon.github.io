// 直近に Focus へ入った Gallery ルート（'/' か '/about'）を保持する。
// Focus の × の戻り先に使う。直接 /focus/[id] を開いた場合は既定の '/'。
export const nav = $state({ from: '/' })
