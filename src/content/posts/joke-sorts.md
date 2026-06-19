---
title: ネタソートまとめ
date: 2026-06-19
description: ソート...?
---

# ボゴソート

計算量: O(n)~O(∞)、平均O(n!^n)

最大は無限、最小はnというネタ界隈では一番有名かつ実用的なソート

```go
func BogoSort(arr) {
  while (!isSorted(arr)) {
    shuffle(arr)
  }
  return arr
}

// i: [8, 2, 5, 7, 6]
// o: [2, 5, 6, 7, 8]
```

# (量子ボゴソート)

計算量: O(n) — ただし宇宙の破壊を前提とする

量子力学に基づいたボゴソート。宇宙を選び抜いて他を破壊する能力者であれば最強になれる。

```go
func QuantumBogoSort(arr) {
  shuffle(arr)
  if (!isSorted(arr)) destroyUniverse()
  return arr
}

// i: [8, 2, 5, 7, 6]
// o: [2, 5, 6, 7, 8] | ☠
```
ボゴソートにはこれ以外にも様々な派生があるが、この先は君の目で確かめてみてくれ！


# スターリンソート

計算量: O(n)

最初に見たとき爆笑した。一番クオリティが高いと思う。
昇順に並んでいない要素、従わぬものを「粛清」する。

```go
func StalinSort(arr) {
  var result = 
  var current = arr[0]
  for (var i = 0 i < arr.len i++){
    if(current > arr[i]) continue
    current = arr[i]
    result.push(current)
  }
  return result
}

// i: [2, 5, 8, 7, 6]
// o: [2, 5, 8]
```

# 洗脳ソート (Abeソート)

計算量: O(n)

昇順でない要素を削除ではなく、そこまでの最大値で上書きする。スターリンソートに比べ、入力の長さが保たれている優れたソートといえる

```go
func BrainwashSort(arr) {
  var current = arr[0]
  for (var i = 1 i < arr.len i++) {
    if (arr[i] < current) {
      arr[i] = current
    } else {
      current = arr[i]
    }
  }
  return arr
}

// i: [2, 5, 8, 7, 6]
// o: [2, 5, 8, 8, 8]
```

# サノスソート

計算量: O(n)

ソートされるまでランダムに要素の半分を削除する。`(ボゴ + スターリン) / 2 = サノス`

```go
func ThanosSort(arr) {    
  while (!isSorted(arr)) {
    half(arr)
  }
  return arr
}

// i: [8, 2, 5, 7, 6, 1]
// o: [2, 5, 7], [2, 5, 6]...(ランダム)
```

# オートクラシーソート

計算量: O(1)

天上天下唯我独尊。究極の独裁
```go
func AutocracySort(arr) {
  return arr[0]
}

// i: [8, 2, 5, 7, 6]
// o: 8
```

# 大本営発表ソート

計算量: O(0)


```go
func Banzai(arr) {
  return [0, 1, 2]
}

// i: [8, 2, 5, 7, 6]
// o: [0, 1, 2]
```

# インテリジェンスデザインソート

計算量: O(Understand)

この配列は全知の創造者によって設計された秩序の中に存在している。したがって現在の順序が最も完璧な順序である。

```go
func IntelligentDesignSort(arr) {
  understand()
  return arr
}

// i: [8, 2, 5, 7, 6]
// o: [8, 2, 5, 7, 6]
```

# ミラクルソート

計算量: O(Faith^-1)

神や宇宙人などによって奇跡が起こることをただ祈る。

```go
func MiracleSort(arr) {
  while (!isSorted(arr)) {
    pray()
  }
  return arr
}

// i: [8, 2, 5, 7, 6]
// o: [2, 5, 6, 7, 8]
```
ちなみに[くいなちゃん語録](https://kuina.ch/quotes/quotes_41-48#9888547364472003)にインテリジェンスデザインとミラクルを足して二で割ったような、スピリチュアルソートというのが乗っている。こっちのほうが個人的には好きだが、一般性の観点から泣く泣く除外

# コミューンソート

計算量: O(n)

みんな平等な、実に社会主義的なソートである。

```go
func CommuneSort(arr) {
  var value = arr.sum() / arr.len
  return new Array(arr.len).fill(value)
}

// i: [8, 2, 5, 7, 6]
// o: [5.6, 5.6, 5.6, 5.6, 5.6]
```

# キムソート

計算量: O(n)

将軍様こそが絶対なのである。

```go
func KimSort(arr) {
    var result = new Array(arr.len)
    result[arr.len - 1] = arr.sum()
    return result
}

// i: [8, 2, 5, 7, 6]
// o: [0, 0, 0, 0, 28]
```

# 積み立てソート

計算量: O(n)

n番目を0からnの合計として表す。ソートできてるな！ヨシッ！
```go
func StackSort(arr) {
  var result = new Array(arr.len)
  var sum = 0
  for (var i = 0 i < arr.len i++) {
    sum += arr[i]
    result[i] = sum
  }
  return result
}

// i: [8, 2, 5, 7, 6]
// o: [8, 10, 15, 22, 28]
```

# せっかくなので
自分も新規ソートを提案しておきます。その名もインデックスソート。

計算量: O(n)

n番目をnとして出力します。検索してみたところDBのインデックスとかが引っ掛かりました。そういうところも非常にクソでいいですね(?)

```go
func IndexSort(arr) {
  var result = new Array(arr.len)
  for (var i = 0 i < arr.len i++) {
    result[i] = i
  }
  return result
}

// i: [8, 2, 5, 7, 6]
// o: [0, 1, 2, 3, 4]
```

あとここでは除外したが、遅くすることに特化したソート、特にスリープソートあたりが面白かった。ぜひ新しいソートを探してみてほしい
