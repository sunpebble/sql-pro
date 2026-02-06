'use client';

import type { ComponentProps, ComponentPropsWithoutRef } from 'react';
import { memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

const markdownComponents: ComponentPropsWithoutRef<
  typeof Markdown
>['components'] = {
  h1: ({ children, ...props }) => (
    <h1
      className="mb-2 font-semibold"
      style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.3)' }}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="mb-2 font-semibold"
      style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="mb-1 font-medium"
      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="bg-muted rounded-md px-1 py-0.5 font-mono"
          style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn('block', className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="bg-muted my-2 overflow-x-auto rounded-md p-3 font-mono"
      style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
      {...props}
    >
      {children}
    </pre>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-primary underline hover:no-underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-muted-foreground/30 my-2 border-l-2 pl-3 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="min-w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="bg-muted border px-2 py-1 text-left font-medium" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border px-2 py-1" {...props}>
      {children}
    </td>
  ),
  hr: (props) => <hr className="border-muted my-3" {...props} />,
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
};

export type ResponseProps = ComponentProps<'div'> & {
  children: string;
};

export const Response = memo(
  ({ children, className, ...props }: ResponseProps) => (
    <div className={cn('prose prose-sm max-w-none', className)} {...props}>
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {children}
      </Markdown>
    </div>
  )
);

Response.displayName = 'Response';
