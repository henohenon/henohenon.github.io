// アプリ共有の単一シーケンスコントローラ（Tone.js）。
// コトハコビ本体 `allo-app/src/audio/sequence.ts` の移植（荷物一覧に要る分だけ）。
//   - 起動時に一度だけ Transport を開始し、以降リセットしない
//     → Icon ホバーで鳴り始めた音が、Focus（荷物一覧）へ遷移しても途切れずつながる（§6 ギミック）。
//   - BPM110 固定・ファミコン風ビート（キック4つ打ち / スネア2・4拍 / ハイハット8分）。
//   - 荷物一覧グルーヴは addListGroove（ファンクベース＋シンコペチャイム＋スタブ＋16分ハット＋スウィング）。
// 本体にあった送る/受信シーン用の音源（pressKick / machine / scan / bass）は移植対象外。

import * as Tone from 'tone'

/** 楽曲全体のテンポ。 */
export const BPM = 110
/** 1 拍の長さ（秒）。 */
export const SEC_PER_BEAT = 60 / BPM

export interface BeatInfo {
  /** 起動からの通し拍番号（0, 1, 2, ...）。 */
  index: number
  /** プレス拍（2 拍ごと = 偶数拍）か。 */
  isPress: boolean
  /** 発火したオーディオ時刻（秒）。 */
  time: number
}

type BeatListener = (beat: BeatInfo) => void

class SequenceController {
  private synth: Tone.Synth | null = null
  private kick: Tone.MembraneSynth | null = null
  private snare: Tone.NoiseSynth | null = null
  private hat: Tone.NoiseSynth | null = null
  /** 8 分ハイハットに重ねる裏 16 分用（Noise は start 時刻が単調増加のため hat と分離）。 */
  private busyHat: Tone.NoiseSynth | null = null
  private listBass: Tone.Synth | null = null
  private listChime: Tone.Synth | null = null
  /** 全音源を束ねるマスター。フェードで出し入れしてクリック/唐突さ（カクつき）を消す。 */
  private master: Tone.Gain | null = null
  /** leave 後に「フェード終わりで stop」する予約。再 enter で cancel する。 */
  private stopTimer: ReturnType<typeof setTimeout> | null = null
  private built = false
  /** 音を出したい状態か（ホバー/Focus 中は true）。await 跨ぎの競合を解く唯一の真実。 */
  private wantAudible = false
  private beatIndex = 0
  private readonly drawListeners = new Set<BeatListener>()
  private readonly audioListeners = new Set<BeatListener>()

  /** 音源とビートのスケジュールを一度だけ構築する（Transport の開始は resume が担う）。 */
  private async ensure(): Promise<void> {
    if (this.built) return
    this.built = true

    await Tone.start()

    // マスター（初期 gain=0＝無音）。全音源をここに束ねてフェードで出し入れする。
    const master = (this.master = new Tone.Gain(0).toDestination())

    // 効果音用: 矩形波＋短い減衰。
    this.synth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 },
      volume: -12,
    }).connect(master)

    // キック: パンチのある膜シンセ。
    this.kick = new Tone.MembraneSynth({
      octaves: 6,
      pitchDecay: 0.04,
      envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.02 },
      volume: -6,
    }).connect(master)

    // スネア: 白ノイズのバースト（NES のノイズチャンネル風）。
    this.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
      volume: -14,
    }).connect(master)

    // ハイハット: 短いノイズをハイパスで通す。
    const createHat = (): Tone.NoiseSynth => {
      const hatFilter = new Tone.Filter(8000, 'highpass').connect(master)
      return new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
        volume: -22,
      }).connect(hatFilter)
    }
    this.hat = createHat()
    this.busyHat = createHat()

    // 荷物一覧: スタッカートなファンクベース。
    this.listBass = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.003, decay: 0.14, sustain: 0.15, release: 0.04 },
      volume: -8,
    }).connect(master)

    // 荷物一覧: シンコペしたチャイム。
    this.listChime = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.05 },
      volume: -14,
    }).connect(master)

    const transport = Tone.getTransport()
    transport.bpm.value = BPM
    transport.scheduleRepeat((time) => this.kick?.triggerAttackRelease('C1', '8n', time), '4n', 0) // 4つ打ち
    transport.scheduleRepeat((time) => this.snare?.triggerAttackRelease('8n', time), '2n', '4n') // 2・4拍
    transport.scheduleRepeat((time) => this.hat?.triggerAttackRelease('16n', time), '8n', 0) // 8分
    transport.scheduleRepeat((time) => this.onTick(time), '4n', 0)

    // 起動時に resume できなかった場合の保険（初回操作で AudioContext を resume）。
    if (Tone.getContext().state !== 'running') {
      const kick = () => void Tone.start()
      window.addEventListener('pointerdown', kick, { once: true })
      window.addEventListener('keydown', kick, { once: true })
    }
  }

  /** クリック除去だけの極短デクリック（秒）。“滑らかさ”ではなくノイズ対策。 */
  private static readonly DECLICK = 0.008
  /** leave 後に stop（頭出しリセット）するまでの猶予（ms）。この間の再 enter は巻き戻さず継続。 */
  private static readonly STOP_DELAY_MS = 500

  /**
   * 音を出す。ホバー入り / Focus 入場で呼ぶ。
   * 完全に止まってからの新規 enter だけ“頭から”リセット。猶予内の再 enter（＝ホバー連打）は
   * 巻き戻さず継続＝激しいリセットにならない。立ち上がりはほぼ即時（デクリックのみ）。
   */
  async enter(): Promise<void> {
    this.wantAudible = true
    await this.ensure()
    if (!this.wantAudible) return // await 中に leave されていたら鳴らさない
    if (this.stopTimer) {
      clearTimeout(this.stopTimer)
      this.stopTimer = null
    }
    const transport = Tone.getTransport()
    if (transport.state !== 'started') {
      // 完全停止＝新規ホバー。頭からリセットして開始。
      transport.stop()
      this.beatIndex = 0
      transport.start()
    }
    this.master?.gain.rampTo(1, SequenceController.DECLICK)
  }

  /** 音を止める。ほぼ即無音→猶予後に stop（頭出し）。猶予内に再 enter すれば巻き戻さず継続。 */
  leave(): void {
    this.wantAudible = false
    this.master?.gain.rampTo(0, SequenceController.DECLICK)
    if (this.stopTimer) clearTimeout(this.stopTimer)
    this.stopTimer = setTimeout(() => {
      this.stopTimer = null
      if (!this.wantAudible) Tone.getTransport().stop()
    }, SequenceController.STOP_DELAY_MS)
  }

  private onTick(time: number): void {
    const index = this.beatIndex++
    const isPress = index % 2 === 0
    const beat: BeatInfo = { index, isPress, time }
    this.audioListeners.forEach((listener) => listener(beat))
    Tone.getDraw().schedule(() => {
      this.drawListeners.forEach((listener) => listener(beat))
    }, time)
  }

  /** 拍イベント（描画フレーム同期）を購読。返り値で解除。視覚演出用。 */
  onBeat(listener: BeatListener): () => void {
    this.drawListeners.add(listener)
    return () => this.drawListeners.delete(listener)
  }

  /** 拍イベント（オーディオ時刻）を購読。返り値で解除。音の発火用。 */
  onBeatAudio(listener: BeatListener): () => void {
    this.audioListeners.add(listener)
    return () => this.audioListeners.delete(listener)
  }

  /** beatsPerCycle 拍を 1 周期とみなした連続位相（0..1）。 */
  phase(beatsPerCycle: number): number {
    const cycle = SEC_PER_BEAT * beatsPerCycle
    const sec = Tone.getTransport().seconds
    return (sec % cycle) / cycle
  }

  /** ファミコン風 square blip。time を渡すとそのオーディオ時刻へスケジュール。 */
  playBlip(note = 'C5', duration = '16n', time?: number): void {
    this.synth?.triggerAttackRelease(note, duration, time)
  }

  /** Transport に繰り返しイベントを追加し、解除関数を返す汎用ヘルパ。 */
  private scheduleLayer(
    callback: (time: number) => void,
    interval: string,
    startTime: string | number = 0,
  ): () => void {
    const id = Tone.getTransport().scheduleRepeat(callback, interval, startTime)
    return () => Tone.getTransport().clear(id)
  }

  /** 8 分音符グリッド上の通しステップ番号。 */
  private eighthAt(time: number): number {
    const transport = Tone.getTransport()
    return Math.round(transport.getTicksAtTime(time) / (transport.PPQ / 2))
  }

  /** ハイハットを 16 分に増やす（既定 8 分の隙間=裏 16 分を追加）。解除関数を返す。 */
  addBusyHats(): () => void {
    return this.scheduleLayer((time) => this.busyHat?.triggerAttackRelease('32n', time), '16n', '16n')
  }

  /**
   * 荷物一覧向けのグルーヴ一式。8 分ファンクベース + シンコペチャイム + 2・4 拍スタブ +
   * 16 分ハイハット + スウィング。8 ステップ = 4/4 の 1 小節。解除関数を返す。
   */
  addListGroove(): () => void {
    const transport = Tone.getTransport()
    const prevSwing = transport.swing
    const prevSwingSub = transport.swingSubdivision
    transport.swing = 0.12
    transport.swingSubdivision = '8n'

    const bassLine: (string | null)[] = ['C2', null, 'C2', 'E2', null, 'G2', 'G2', 'A1']
    const chimeLine: (string | null)[] = [null, null, 'G4', null, 'C5', null, 'E4', null]

    const removeBass = this.scheduleLayer((time) => {
      const note = bassLine[this.eighthAt(time) % bassLine.length]
      if (note) this.listBass?.triggerAttackRelease(note, '16n', time)
    }, '8n')

    const removeChime = this.scheduleLayer((time) => {
      const note = chimeLine[this.eighthAt(time) % chimeLine.length]
      if (note) this.listChime?.triggerAttackRelease(note, '16n', time)
    }, '8n')

    const removeStab = this.scheduleLayer((time) => this.playBlip('G3', '16n', time), '2n', '4n')
    const removeHats = this.addBusyHats()

    return () => {
      removeBass()
      removeChime()
      removeStab()
      removeHats()
      transport.swing = prevSwing
      transport.swingSubdivision = prevSwingSub
    }
  }
}

let singleton: SequenceController | null = null

/** アプリ共有の単一インスタンスを取得する。 */
export function getSequence(): SequenceController {
  singleton ??= new SequenceController()
  return singleton
}

export type { SequenceController }
