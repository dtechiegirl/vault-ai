import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    ...props,
  }
}

export function IconVault(props: IconProps) {
  return (
    <svg {...base({ ...props, viewBox: '0 0 32 32', width: 28, height: 28, strokeWidth: 0 })}>
      <rect width="32" height="32" rx="8" fill="#0D9488" />
      <path
        d="M16 7.2c-3.3 0-6 1.45-7.4 2.4V18.2c0 4.5 3.2 6.8 7.4 8.3 4.2-1.5 7.4-3.8 7.4-8.3V9.6C22 8.65 19.3 7.2 16 7.2z"
        fill="#0F172A"
        opacity="0.35"
      />
      <rect x="13" y="14.4" width="6" height="6.4" rx="1.2" fill="#F8FAFC" />
      <path d="M16 12.6a2.1 2.1 0 0 0-2.1 2.1v1.4h4.2v-1.4A2.1 2.1 0 0 0 16 12.6z" stroke="#F8FAFC" strokeWidth="1.5" />
    </svg>
  )
}

export function IconUpload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 16V6" />
      <path d="m8 10 4-4 4 4" />
      <path d="M5 18h14" />
    </svg>
  )
}

export function IconSend(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 12 14-7-4 14-3-5-7-2z" />
    </svg>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M18 7v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" />
    </svg>
  )
}

export function IconChevron(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}

export function IconSpark(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M5 12H3" />
      <path d="M21 12h-2" />
      <path d="m6 6 2 2" />
      <path d="m16 16 2 2" />
      <path d="m18 6-2 2" />
      <path d="m8 16-2 2" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  )
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M8 4v4" />
      <path d="M16 4v4" />
      <path d="M4 11h16" />
    </svg>
  )
}

export function IconFaq(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 9a4 4 0 1 1 4.5 4v1" />
      <path d="M12 17h.01" />
      <rect x="4" y="3" width="16" height="18" rx="3" />
    </svg>
  )
}

export function IconFile(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

export function IconSources(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 5h14" />
      <path d="M5 12h14" />
      <path d="M5 19h10" />
    </svg>
  )
}

export function IconChat(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 16.5V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9z" />
      <path d="m8 19 3-2.5" />
    </svg>
  )
}

export function IconStudio(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m7 7 10 10" />
      <path d="m17 7-10 10" />
    </svg>
  )
}
