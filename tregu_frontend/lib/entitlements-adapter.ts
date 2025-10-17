import * as Ent from './entitlements';

// Always expose callable functions, regardless of how the source file exports
export const getCurrentTier =
  (Ent as any).getCurrentTier ??
  (Ent as any).default ??
  (() => 'free'); // fallback so build won’t explode

export const hasFeature =
  (Ent as any).hasFeature ??
  ((_: string) => false);

export default getCurrentTier;
