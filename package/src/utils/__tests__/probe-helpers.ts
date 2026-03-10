/**
 * Helper functions for source-location probing tests.
 *
 * These are defined in a separate file whose name does NOT contain
 * "source-location", because parseComponentFrame skips stack frames
 * that match /source-location/. By defining the component functions
 * here, their stack frames will reference "probe-helpers.ts" instead,
 * allowing parseComponentFrame to find a valid non-internal frame.
 */
import React from "react";

/**
 * A function component that accesses the React dispatcher via hooks.
 * When the probing code installs a proxy dispatcher, calling this
 * function will throw a "probe" Error whose stack trace includes
 * this file's path — which passes parseComponentFrame's skip filters.
 */
export function ProbeableComponent() {
  const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  if (internals && internals.ReactCurrentDispatcher) {
    internals.ReactCurrentDispatcher.current.useState(0);
  }
  return null;
}

/**
 * A ForwardRef render function for testing unwrapComponentType's ForwardRef path.
 */
export function ProbeableForwardRefRender(_props: any, _ref: any) {
  const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  if (internals && internals.ReactCurrentDispatcher) {
    internals.ReactCurrentDispatcher.current.useState(0);
  }
  return null;
}

/**
 * A memo inner function for testing unwrapComponentType's MemoComponent path.
 */
export function ProbeableMemoInner() {
  const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  if (internals && internals.ReactCurrentDispatcher) {
    internals.ReactCurrentDispatcher.current.useState(0);
  }
  return null;
}

/**
 * Component with a bundler-style path simulation.
 * Used to verify cleanSourcePath strips various prefixes.
 */
export function BundlerPathComponent() {
  const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  if (internals && internals.ReactCurrentDispatcher) {
    internals.ReactCurrentDispatcher.current.useState(0);
  }
  return null;
}
