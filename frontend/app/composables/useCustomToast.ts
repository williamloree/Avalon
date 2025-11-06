// Custom toast wrapper - renamed to avoid conflict with Nuxt UI's useToast
// Note: useToast is auto-imported from Nuxt UI, no need to import it explicitly

export function useCustomToast() {
  return {
    success(message: string, duration: number = 5000) {
      const toast = useToast()
      toast.add({
        title: message,
        color: 'green',
        icon: 'i-heroicons-check-circle',
        timeout: duration
      })
    },
    error(message: string, duration: number = 5000) {
      const toast = useToast()
      toast.add({
        title: message,
        color: 'red',
        icon: 'i-heroicons-x-circle',
        timeout: duration
      })
    },
    warning(message: string, duration: number = 5000) {
      const toast = useToast()
      toast.add({
        title: message,
        color: 'orange',
        icon: 'i-heroicons-exclamation-triangle',
        timeout: duration
      })
    },
    info(message: string, duration: number = 5000) {
      const toast = useToast()
      toast.add({
        title: message,
        color: 'blue',
        icon: 'i-heroicons-information-circle',
        timeout: duration
      })
    }
  }
}
