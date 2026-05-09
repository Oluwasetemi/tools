import type { LinkProps } from '@tanstack/react-router'
import * as Headless from '@headlessui/react'
import { Link as TanStackLink } from '@tanstack/react-router'
import React, { forwardRef } from 'react'


// eslint-disable-next-line prefer-arrow-callback
export const Link = forwardRef(function Link(
  props: LinkProps & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <Headless.DataInteractive>
      <TanStackLink {...props} ref={ref} />
    </Headless.DataInteractive>
  )
})
