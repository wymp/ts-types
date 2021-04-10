Types for the Wymp Ecosystem
===============================================================================

This library provides a lightweight dependency containing only types relevant to packages in the
Wymp ecosystem. Nearly every Wymp package will depend on this package, but packages outside of Wymp
that would like to utilize Wymp structures can also depend on this package without pulling in all of
the additional dependencies and bloat of the other Wymp packages, which they surely will not need.

**NOTE:** This library does NOT overlap with [@wymp/ts-simple-interfaces](https://github.com/wymp/ts-simple-interfaces).
That library attempts to present simplified interfaces over common items in the broader Typescript
world, whereas this one is focused exclusively on Wymp internals.

