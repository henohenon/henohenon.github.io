import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <section class="top">
    <pre class="face">へ　へ
の　の
　ん</pre>
    <div class="card">
      <p>初めまして、へのへのんと申します。</p>
      <p>ここではポートフォリオを兼ねて、自分の作品を展示しています。興味を持っていただけたり、楽しんでいただければ幸いです。</p>
    </div>
  </section>
  <section class="pieces">
    <div class="piece">
      <div class="content"></div>
      <div class="name-card"><p>作品名</p></div>
    </div>
    <div class="piece">
      <div class="content"></div>
      <div class="name-card"><p>作品名</p></div>
    </div>
    <div class="piece">
      <div class="content"></div>
      <div class="name-card"><p>作品名</p></div>
    </div>
    <div class="piece">
      <div class="content"></div>
      <div class="name-card"><p>作品名</p></div>
    </div>
    <div class="piece">
      <div class="content"></div>
      <div class="name-card"><p>作品名</p></div>
    </div>
    <div class="piece">
      <div class="content"></div>
      <div class="name-card"><p>作品名</p></div>
    </div>
  </section>
  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} henohenon</p>
  </footer>
`
