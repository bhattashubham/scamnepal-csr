/**
 * Theme utility functions for consistent color usage
 */

export const themeColors = {
  // Status colors
  success: 'text-success bg-success/10',
  successIcon: 'text-success',
  successBg: 'bg-success/10',
  successText: 'text-success',
  
  warning: 'text-warning bg-warning/10',
  warningIcon: 'text-warning',
  warningBg: 'bg-warning/10',
  warningText: 'text-warning',
  
  destructive: 'text-destructive bg-destructive/10',
  destructiveIcon: 'text-destructive',
  destructiveBg: 'bg-destructive/10',
  destructiveText: 'text-destructive',
  
  info: 'text-info bg-info/10',
  infoIcon: 'text-info',
  infoBg: 'bg-info/10',
  infoText: 'text-info',
  
  // Primary colors
  primary: 'text-primary bg-primary/10',
  primaryIcon: 'text-primary',
  primaryBg: 'bg-primary/10',
  primaryText: 'text-primary',
  
  // Secondary colors
  secondary: 'text-secondary-foreground bg-secondary',
  secondaryIcon: 'text-secondary-foreground',
  secondaryBg: 'bg-secondary',
  secondaryText: 'text-secondary-foreground',
  
  // Neutral colors
  muted: 'text-muted-foreground bg-muted',
  mutedIcon: 'text-muted-foreground',
  mutedBg: 'bg-muted',
  mutedText: 'text-muted-foreground',
  
  // Special colors
  orange: 'text-orange bg-orange/10',
  orangeIcon: 'text-orange',
  orangeBg: 'bg-orange/10',
  orangeText: 'text-orange',
  
  purple: 'text-purple bg-purple/10',
  purpleIcon: 'text-purple',
  purpleBg: 'bg-purple/10',
  purpleText: 'text-purple',
  
  // Text colors
  foreground: 'text-foreground',
  cardForeground: 'text-card-foreground',
  
  // Background colors
  background: 'bg-background',
  card: 'bg-card',
} as const

export const getStatusColors = (status: string) => {
  switch (status) {
    case 'verified':
    case 'confirmed':
    case 'approved':
      return {
        icon: themeColors.successIcon,
        badge: themeColors.success,
        text: themeColors.successText,
        bg: themeColors.successBg,
      }
    case 'rejected':
    case 'disputed':
      return {
        icon: themeColors.destructiveIcon,
        badge: themeColors.destructive,
        text: themeColors.destructiveText,
        bg: themeColors.destructiveBg,
      }
    case 'under_review':
    case 'pending':
      return {
        icon: themeColors.warningIcon,
        badge: themeColors.warning,
        text: themeColors.warningText,
        bg: themeColors.warningBg,
      }
    case 'cleared':
      return {
        icon: themeColors.infoIcon,
        badge: themeColors.info,
        text: themeColors.infoText,
        bg: themeColors.infoBg,
      }
    default:
      return {
        icon: themeColors.mutedIcon,
        badge: themeColors.muted,
        text: themeColors.mutedText,
        bg: themeColors.mutedBg,
      }
  }
}

export const getRiskScoreColors = (score: number) => {
  if (score >= 80) return themeColors.destructive
  if (score >= 60) return themeColors.warning
  if (score >= 40) return themeColors.orange
  return themeColors.success
}

export const getFileTypeColors = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return themeColors.success
  if (mimeType.startsWith('video/')) return themeColors.purple
  if (mimeType.startsWith('audio/')) return themeColors.info
  if (mimeType.includes('pdf')) return themeColors.destructive
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return themeColors.success
  if (mimeType.includes('zip') || mimeType.includes('rar')) return themeColors.orange
  return themeColors.muted
}
