import './style.css'
import { startRouter, type Route } from './router.ts'
import { renderIndex, renderFocus } from './views.ts'

const app = document.querySelector<HTMLDivElement>('#app')!

function render(route: Route): void {
  switch (route.name) {
    case 'focus':
      app.innerHTML = renderFocus(route.id)
      break
    case 'about':
      app.innerHTML = renderIndex(true)
      break
    case 'index':
      app.innerHTML = renderIndex(false)
      break
  }
  window.scrollTo(0, 0)
}

startRouter(render)
