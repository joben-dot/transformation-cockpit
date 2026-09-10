# Rules, meaning and interface review

This review builds on the existing ten-step workflow and normalized domain. It corrects contradictions between command rules, status selectors, case views and portfolio views.

## Governing distinctions

| Topic | Rule and interface meaning |
| --- | --- |
| Priority review | A reviewed priority assessment can satisfy the priority component of start readiness. START, WAIT, INVESTIGATE or STOP recommendations advise the human decision; they are not a separate mandatory START gate. |
| Actual start | Requires all other start conditions, an authorized person, explicit acceptance and rationale. Browsing, scoring, reviewing and assembling a package never start an initiative. |
| Dependency timing | INITIATIVE_START is an explicit initiative gate. NODE_START concerns the successor delivery. MILESTONE concerns a later dated requirement. Existing NODE_START records retain their delivery meaning. |
| Future dependencies | Need a responsible person and a coherent plan. A predecessor planned after its required date is a planning conflict. An unavailable future delivery is not automatically an initiative start blocker. |
| Measurement | Confirmed business change, forecast, reported observation, specialist verification and final outcome remain separate. An interim measurement is not a final missed-target finding. |
| Closure | All planned measurement points, including full effect, must be verified. Closure preserves missed or negative effects. Further change after closure requires a separate initiative. |
| Economics | Missing cost evidence is not zero cost. Incomplete annual effect windows do not produce a complete financial effect or net figure. |
| Shared prerequisites | Grouping requires real direct or indirect blocking relationships. Context membership alone is not a dependency. |

## Corrections

- Compact expandable dependency summary with consistent total, separate start and delivery sections, named successor, responsible owner and relationship-specific need date.
- Dependency editing exposes the three timing meanings and a milestone date; validation rejects invalid dates and start gates without an owning initiative.
- Newest priority assessment selection is shared by the workflow, start readiness, case ranking, assessment editor and package collection.
- Reviewed assessments are labelled “Granskade underlag”; old packages referencing a superseded assessment must be refreshed.
- Qualification includes both challenge-level and initiative-level requirements.
- The shared follow-up selector supplies pending changes and measurements. Started cases continue through steps 8–10 instead of returning to preparation due to later changes in current reference data.
- A case remains in implementation while any accepted local change remains unconfirmed. Completed recipients can still be followed up independently.
- Future measurements are waiting work; reported points need specialist verification. Closed results link to learning.
- Incomplete input stays with its own case when users switch cases. Date inputs work in the managed browser. A conditional React hook in the navigation shell was corrected.
- Area membership respects participation dates. External enabling capacity remains visible with an explicit label.
- Existing document support, profile comparison, allocation, scenario, change-decision, role/mandate and locked-history functions remain.

## Verification

The final full suite passes 249 tests in 42 files. New regressions cover advisory priority outcomes with explicit human start, latest-assessment replacement, explicit initiative versus delivery gates, future follow-up versus pending verification, missing costs and partial annual effects, pre-start change dates, all planned measurements before closure, real dependency grouping, milestone dates and case-specific drafts.

TypeScript, ESLint and the production build pass. Existing build chunk-size and server-rendering test warnings remain informational.

Managed browser checks exercised actual priority review without start, moving through incomplete later steps and back, the collapsed dependency overview, the timing selector and milestone date, area-filtered timeline, shared-dependency grouping, capacity shortage and scenario availability. The existing complete form journey also passes from challenge through review, acceptance, start, measurement, verification, missed target and closure.

This remains a session-based demo. The timeline represents planned delivery periods and separately recorded availability; it does not reconstruct all actual project events. Dedicated mobile, assistive-technology and end-user usability testing remain outside this desktop review. No measured click-reduction claim is made.
