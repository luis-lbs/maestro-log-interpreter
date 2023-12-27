import { ThemeProvider } from './components/theme-provider'
import Home from './Home'

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

function App() {  
  return (
    <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
      {<Home/>}
    </ThemeProvider>
  )
}

export default App