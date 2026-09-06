# Transformation demo: implementation contract

The application is an architectural restart in the existing repository. The normalized domain is the source of truth. Existing legacy lifecycle/scenario modules are not the application's governing model.

## Sources and limits

The user-provided purpose and architectural corrections govern this implementation. The original transformation report and actual locally adapted PPS templates were not available for source verification. `public/inledning.html` preserves the supplied introductory mapping, clearly distinguishing it from independently verified report analysis. No real initiatives or personal management anecdotes appear in demo data.

## Active architecture

- `CaseWorkspace` and `AssessmentEditors`: strategic challenge, businesscase, qualification, nonbinding effect potential, explicit criterion scores.
- `demoReducer`: shared atomic command boundary with reference validation and audit.
- `transformationReducer`: local commitment drafts, owner acceptance, versioned preparation, human start/change decisions, business change, forecast, measurement, verification, closure.
- `transformationSelectors`: start blockers, currently decided commitments, verified outcomes, planned economics.
- `EffectWorkspace`: explicit role acting for a synthetic demo. Role selection is not authentication.
- `PrerequisiteEditor`: normalized nodes, graph edges, evidence of availability and separately owned cost posts.
- `ControlRoom`: source-derived stages and drill-down; latest verified point per active commitment. Potential, goals, plans, forecasts and realized change are never added together.
- `GovernanceWorkspace`: versioned documentary governance assumptions. Prioritization weights and existing allocation rules are structured executable configuration; free-text governance fields do not become executable rules.

## Invariants

1. Assessed potential is nonbinding and precedes prioritization. Editing it makes prior ranking evidence stale.
2. Each receiving business supplies and accepts its own commitment. IT, project support and AI cannot bind that business.
3. Start is blocked in the reducer if recipients, mandate, local acceptance, baseline, dates, source, roles, capacity declaration, quality or start prerequisites are missing.
4. A human start creates an immutable snapshot. A formal change creates another snapshot and preserves all previous decisions. Operational change evidence and measurements are separate from the frozen snapshot.
5. Forecasts never count as realized effect. Only verified, nonfuture measurements produce an outcome against the original local baseline. Negative and missed effects remain visible.
6. Cost posts are deduplicated by their domain identity/version; allocation is not a second cost. Annual effect rates, explicit annual financial plans and actual economic postings are distinct.
7. Prioritization does not certify capacity or allow starting an initiative ahead of a blocking external prerequisite.
8. Reuse and scaling require a new recipient's local commitment and active acceptance; no copying of realized results.

## Production work still required

Authentication, server authorization, persistent transactional storage, concurrent editing, robust typed decision envelopes and signatures, document ingestion and provenance, integrations, actual AI analysis with human review, executable policy administration, legal assessment workflow, quantitative capacity acceptance, and independent security/accessibility review. The demo's application-layer gates are not security boundaries for a production service.

Do not claim that this scaffold guarantees an easy or cost-free conversion to production. Its stable identities, normalized records and pure projections provide a usable foundation.

## Verification

`npm test`, `npm run build`, `npm run lint`. The transformation journey tests cover missing acceptance, wrong owner, future/unverified measurement, forecast isolation, immutable original decisions, formal version changes and scaling. The React form interaction test goes from a visible local draft through start and verified measurement into the control room. This runtime blocks Chromium's socket creation, so visual browser execution was not completed locally.

## Reading and interaction levels

The default case view is now FlowOverview. It contains no inputs: eight derived status rows link to scoped detail work. Green reports recorded evidence or a decision, never an editable completion flag or permission to start. The existing command validation remains authoritative. Completed material opens as a read-only summary; editing is an explicit disclosure. A recorded start opens decision history. Qualification points and optional editors are collapsed individually. Comparison, potential, prerequisites and costs have separate tabs.

The main element has its own bounded-width rule (not an adjacent-header selector), an 18px base size and responsive side whitespace. Demo clock settings are collapsed. Flow navigation tests cover a form-free overview, preserved case identity and separation of potential from commitments, human start and actual effect.
