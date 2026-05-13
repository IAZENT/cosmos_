import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes, ElementType, ReactNode } from 'react'

type CosmosCardProps<T extends ElementType = 'div'> = {
  as?: T
  interactive?: boolean
  className?: string
  children: ReactNode
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

export function CosmosCard<T extends ElementType = 'div'>({
  as,
  interactive = false,
  className,
  children,
  ...rest
}: CosmosCardProps<T>) {
  const Tag = (as ?? 'div') as ElementType
  return (
    <Tag
      className={cn(
        'cosmos-card',
        interactive &&
          'transition-colors duration-150 hover:border-[var(--cosmos-text-dim)]',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
