import './commands'

// Suprimir errores de red no interceptados para evitar fallos en tests por llamadas externas
Cypress.on('uncaught:exception', (err) => {
  // Ignorar errores de red y de módulos cargados en diferido que no afectan el test
  if (
    err.message.includes('Network Error') ||
    err.message.includes('Request failed') ||
    err.message.includes('Cannot read properties of undefined') ||
    err.message.includes('ResizeObserver loop') ||
    err.message.includes('ChunkLoadError')
  ) {
    return false
  }
  return true
})
