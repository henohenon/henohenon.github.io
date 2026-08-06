// タイトル画面タグを「ロゴ(AAストローク)＋工場＋地面＋3ボタン」の全体構成に差し替える。
// gen-logo.mjs のロゴ出力を上部に、下に工場(north-light)・地面・ボタンを合成して boxTexts.ts に書き戻す。
import { readFileSync, writeFileSync } from 'node:fs'
import { genLogo } from './gen-logo.mjs'

const logo = genLogo()
const factory = [
  '                                          ╱│',
  '                                          ││╱│╱│╱│',
  '────────────────────────────────────────┘          └──',
]
const buttons = [
  '      ┌──────────┐    ┌──────────┐    ┌──────────┐',
  '      │   送る   │    │ 受け取る │    │ 荷物一覧 │',
  '      └──────────┘    └──────────┘    └──────────┘',
]
const content = ['', ...logo, '', ...factory, ...buttons].join('\n')

const path = 'src/lib/kotohakobi/boxTexts.ts'
let src = readFileSync(path, 'utf8')
src = src.replace(/(name: 'タイトル',\s*aa: `)[\s\S]*?(`)/, (_, a, b) => a + content + b)
writeFileSync(path, src)
console.log('タイトルaa 差し替え完了')
