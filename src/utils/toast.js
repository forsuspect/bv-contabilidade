// Dispara uma mensagem estilizada na tela sem usar React Context
// Uso: toast('Mensagem aqui', 'success' | 'error' | 'info')
export const toast = (message, type = 'info') => {
  try {
    window.dispatchEvent(new CustomEvent('bv-toast', { detail: { message, type } }));
  } catch (e) {
    console.warn('Toast error:', e);
  }
};
