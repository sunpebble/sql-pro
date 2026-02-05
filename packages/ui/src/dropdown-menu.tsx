import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { CheckIcon, ChevronRightIcon } from 'lucide-react';

import * as React from 'react';
import { cn } from './lib/utils';

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
  children,
  render,
  nativeButton = true,
  ...props
}: MenuPrimitive.Trigger.Props) {
  // If render is provided, use it; otherwise use children as render
  // This allows: <DropdownMenuTrigger><Button>...</Button></DropdownMenuTrigger>
  // to work without nesting buttons
  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      render={render ?? (children as React.ReactElement)}
      nativeButton={nativeButton}
      {...props}
    />
  );
}

function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            'bg-popover text-popover-foreground border-border z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-[5px] border-2 p-1 shadow-[4px_4px_0px_0px_var(--border)] duration-100 outline-none data-closed:overflow-hidden',
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean;
}) {
  // GroupLabel must be wrapped in Group to provide the required context
  return (
    <MenuPrimitive.Group>
      <MenuPrimitive.GroupLabel
        data-slot="dropdown-menu-label"
        data-inset={inset}
        className={cn(
          'text-muted-foreground px-2 py-1.5 [font-size:calc(var(--font-ui-size,14px)*0.75)] font-bold data-inset:ps-8',
          className
        )}
        {...props}
      />
    </MenuPrimitive.Group>
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-main focus:text-main-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive group/dropdown-menu-item relative flex cursor-default items-center gap-2 rounded-[3px] px-2 py-1.5 [font-size:var(--font-ui-size,14px)] font-medium outline-hidden transition-colors duration-100 ease-out select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:ps-8 data-[variant=destructive]:focus:text-white [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  nativeButton = true,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      nativeButton={nativeButton}
      className={cn(
        "focus:bg-main focus:text-main-foreground data-open:bg-main data-open:text-main-foreground flex cursor-default items-center gap-2 rounded-[3px] px-2 py-1.5 [font-size:var(--font-ui-size,14px)] font-medium outline-hidden transition-colors duration-100 ease-out select-none data-inset:ps-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ms-auto" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  align = 'start',
  alignOffset = -3,
  side = 'right',
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        'bg-popover text-popover-foreground border-border w-auto min-w-28 rounded-[5px] border-2 p-1 shadow-[4px_4px_0px_0px_var(--border)] duration-100',
        className
      )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-main focus:text-main-foreground relative flex cursor-default items-center gap-2 rounded-[3px] py-1.5 ps-2 pe-8 [font-size:var(--font-ui-size,14px)] font-medium outline-hidden transition-colors duration-100 ease-out select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute end-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-main focus:text-main-foreground relative flex cursor-default items-center gap-2 rounded-[3px] py-1.5 ps-2 pe-8 [font-size:var(--font-ui-size,14px)] font-medium outline-hidden transition-colors duration-100 ease-out select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute end-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('bg-border -mx-1 my-1 h-0.5', className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'text-muted-foreground group-focus/dropdown-menu-item:text-main-foreground ms-auto [font-size:calc(var(--font-ui-size,14px)*0.75)] font-bold tracking-widest',
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
