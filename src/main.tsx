import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from "@chakra-ui/react"
import { Provider } from "@/components/ui/provider"
import './index.css'
import App from './App.tsx'
import '@/utils/XMLHttpRequest-polyfill'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider forcedTheme="light">
      <Theme>
        <App />
      </Theme>
    </Provider>
  </StrictMode>,
)
