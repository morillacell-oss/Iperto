import { execFileSync } from 'node:child_process';

const steps=[
  'build.mjs',
  'postbuild-v104.mjs',
  'postbuild-v107-pricing.mjs',
  'postbuild-v108-simplify-pricing.mjs',
  'postbuild-v109-buyer-home.mjs',
  'postbuild-v111-buyer-tiers.mjs',
  'postbuild-v112-order-flow.mjs',
  'postbuild-v113-hardening.mjs',
  'postbuild-v114-review.mjs',
  'postbuild-v115-validation.mjs',
  'postbuild-v116-premium.mjs',
  'postbuild-v117-wow.mjs',
  'postbuild-v118-refine.mjs',
];
for(const step of steps){
  console.log(`\n▶ ${step}`);
  execFileSync(process.execPath,[step],{stdio:'inherit'});
}
console.log('\nJunta production build complete');
