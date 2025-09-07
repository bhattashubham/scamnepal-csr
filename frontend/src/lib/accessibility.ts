/**
 * Accessibility Utilities for Error Handling
 * Provides screen reader announcements, keyboard navigation, and focus management
 */

import { ProcessedError } from '@/types/errors'

// Screen reader announcement service
class ScreenReaderService {
  private announcementElement: HTMLElement | null = null

  constructor() {
    this.createAnnouncementElement()
  }

  private createAnnouncementElement(): void {
    if (typeof document === 'undefined') return

    this.announcementElement = document.createElement('div')
    this.announcementElement.setAttribute('aria-live', 'polite')
    this.announcementElement.setAttribute('aria-atomic', 'true')
    this.announcementElement.className = 'sr-only'
    this.announcementElement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    document.body.appendChild(this.announcementElement)
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcementElement) return

    this.announcementElement.setAttribute('aria-live', priority)
    this.announcementElement.textContent = message

    // Clear the message after announcement
    setTimeout(() => {
      if (this.announcementElement) {
        this.announcementElement.textContent = ''
      }
    }, 1000)
  }

  announceError(error: ProcessedError): void {
    const message = `Error: ${error.userMessage}. ${this.getErrorGuidance(error)}`
    this.announce(message, 'assertive')
  }

  announceSuccess(message: string): void {
    this.announce(`Success: ${message}`, 'polite')
  }

  announceInfo(message: string): void {
    this.announce(`Info: ${message}`, 'polite')
  }

  private getErrorGuidance(error: ProcessedError): string {
    switch (error.type) {
      case 'validation':
        return 'Please check your input and try again.'
      case 'network':
        return 'Please check your internet connection and try again.'
      case 'authentication':
        return 'Please log in again to continue.'
      case 'authorization':
        return 'You do not have permission to perform this action.'
      case 'business_logic':
        return 'Please review your input and try again.'
      case 'file_upload':
        return 'Please check your file and try again.'
      case 'system':
        return 'Please refresh the page or contact support.'
      default:
        return 'Please try again or contact support if the problem persists.'
    }
  }
}

// Focus management service
class FocusManagementService {
  private focusHistory: HTMLElement[] = []
  private currentFocusElement: HTMLElement | null = null

  saveFocus(): void {
    if (typeof document === 'undefined') return

    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      this.currentFocusElement = activeElement
      this.focusHistory.push(activeElement)
    }
  }

  restoreFocus(): void {
    if (this.currentFocusElement && this.currentFocusElement.focus) {
      this.currentFocusElement.focus()
    }
  }

  focusElement(element: HTMLElement): void {
    if (element && element.focus) {
      this.saveFocus()
      element.focus()
    }
  }

  focusFirstError(): void {
    const errorElement = document.querySelector('[role="alert"], .error-message, [aria-invalid="true"]') as HTMLElement
    if (errorElement) {
      this.focusElement(errorElement)
    }
  }

  focusErrorInForm(formElement: HTMLElement): void {
    const errorElement = formElement.querySelector('[role="alert"], .error-message, [aria-invalid="true"]') as HTMLElement
    if (errorElement) {
      this.focusElement(errorElement)
    }
  }

  trapFocus(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    })

    // Focus first element
    if (firstElement) {
      firstElement.focus()
    }
  }

  clearFocusHistory(): void {
    this.focusHistory = []
    this.currentFocusElement = null
  }
}

// Keyboard navigation service
class KeyboardNavigationService {
  private keyHandlers: Map<string, (event: KeyboardEvent) => void> = new Map()

  addKeyHandler(key: string, handler: (event: KeyboardEvent) => void): void {
    this.keyHandlers.set(key, handler)
  }

  removeKeyHandler(key: string): void {
    this.keyHandlers.delete(key)
  }

  handleKeyDown(event: KeyboardEvent): void {
    const handler = this.keyHandlers.get(event.key)
    if (handler) {
      handler(event)
    }
  }

  setupErrorNavigation(): void {
    this.addKeyHandler('Escape', (event) => {
      const errorModal = document.querySelector('[role="dialog"][aria-labelledby*="error"]')
      if (errorModal) {
        const closeButton = errorModal.querySelector('[aria-label*="close"], [aria-label*="dismiss"]') as HTMLElement
        if (closeButton) {
          closeButton.click()
          event.preventDefault()
        }
      }
    })

    this.addKeyHandler('Enter', (event) => {
      const retryButton = document.querySelector('[aria-label*="retry"], [aria-label*="try again"]') as HTMLElement
      if (retryButton && retryButton.offsetParent !== null) {
        retryButton.click()
        event.preventDefault()
      }
    })
  }

  cleanup(): void {
    this.keyHandlers.clear()
  }
}

// High contrast detection
class HighContrastService {
  private isHighContrast: boolean = false

  constructor() {
    this.detectHighContrast()
    this.setupMediaQueryListener()
  }

  private detectHighContrast(): void {
    if (typeof window === 'undefined') return

    // Check for Windows High Contrast Mode
    if (window.matchMedia('(-ms-high-contrast: active)').matches) {
      this.isHighContrast = true
      return
    }

    // Check for forced colors
    if (window.matchMedia('(forced-colors: active)').matches) {
      this.isHighContrast = true
      return
    }

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.isHighContrast = true
      return
    }
  }

  private setupMediaQueryListener(): void {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(-ms-high-contrast: active), (forced-colors: active)')
    mediaQuery.addEventListener('change', () => {
      this.isHighContrast = mediaQuery.matches
      this.updateErrorStyles()
    })
  }

  private updateErrorStyles(): void {
    if (this.isHighContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }

  isHighContrastMode(): boolean {
    return this.isHighContrast
  }
}

// Create singleton instances
export const screenReaderService = new ScreenReaderService()
export const focusManagementService = new FocusManagementService()
export const keyboardNavigationService = new KeyboardNavigationService()
export const highContrastService = new HighContrastService()

// Accessibility utilities
export const accessibilityUtils = {
  // Screen reader announcements
  announceError: (error: ProcessedError) => screenReaderService.announceError(error),
  announceSuccess: (message: string) => screenReaderService.announceSuccess(message),
  announceInfo: (message: string) => screenReaderService.announceInfo(message),

  // Focus management
  saveFocus: () => focusManagementService.saveFocus(),
  restoreFocus: () => focusManagementService.restoreFocus(),
  focusElement: (element: HTMLElement) => focusManagementService.focusElement(element),
  focusFirstError: () => focusManagementService.focusFirstError(),
  focusErrorInForm: (formElement: HTMLElement) => focusManagementService.focusErrorInForm(formElement),
  trapFocus: (container: HTMLElement) => focusManagementService.trapFocus(container),

  // Keyboard navigation
  setupErrorNavigation: () => keyboardNavigationService.setupErrorNavigation(),
  addKeyHandler: (key: string, handler: (event: KeyboardEvent) => void) => 
    keyboardNavigationService.addKeyHandler(key, handler),
  removeKeyHandler: (key: string) => keyboardNavigationService.removeKeyHandler(key),

  // High contrast
  isHighContrast: () => highContrastService.isHighContrastMode(),

  // ARIA helpers
  setAriaInvalid: (element: HTMLElement, invalid: boolean) => {
    element.setAttribute('aria-invalid', invalid.toString())
  },

  setAriaDescribedBy: (element: HTMLElement, describedBy: string) => {
    element.setAttribute('aria-describedby', describedBy)
  },

  setAriaExpanded: (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString())
  },

  setAriaHidden: (element: HTMLElement, hidden: boolean) => {
    element.setAttribute('aria-hidden', hidden.toString())
  },

  // Error-specific accessibility
  setupErrorAccessibility: (errorElement: HTMLElement, error: ProcessedError) => {
    errorElement.setAttribute('role', 'alert')
    errorElement.setAttribute('aria-live', 'assertive')
    errorElement.setAttribute('aria-atomic', 'true')
    
    // Add error ID for reference
    const errorId = `error-${error.id}`
    errorElement.id = errorId
    
    // Announce error to screen readers
    screenReaderService.announceError(error)
    
    // Focus the error element
    focusManagementService.focusElement(errorElement)
  },

  // Form accessibility
  setupFormAccessibility: (formElement: HTMLElement) => {
    const inputs = formElement.querySelectorAll('input, select, textarea')
    inputs.forEach((input, index) => {
      const inputElement = input as HTMLElement
      const label = formElement.querySelector(`label[for="${inputElement.id}"]`)
      
      if (label) {
        inputElement.setAttribute('aria-labelledby', label.id || `label-${index}`)
      }
    })
  },

  // Cleanup
  cleanup: () => {
    keyboardNavigationService.cleanup()
    focusManagementService.clearFocusHistory()
  },
}

// Initialize accessibility services
if (typeof window !== 'undefined') {
  keyboardNavigationService.setupErrorNavigation()
  
  // Add global keyboard event listener
  document.addEventListener('keydown', (event) => {
    keyboardNavigationService.handleKeyDown(event)
  })
}
