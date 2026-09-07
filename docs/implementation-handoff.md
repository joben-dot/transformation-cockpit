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

## Cockpit and ordering (presentation revision)

ControlRoom is now the landing view: an overview with category-separated potential examples, derived priority scores, open work, cross-initiative prerequisites and real session audit events. Effect follow-up remains a separate tab with the existing economics/measurement calculations. No demo outcomes or fake activity were introduced.

`cockpitSelectors.ts` decorates case projections for display: latest non-draft assessment under the active profile, current potential references, eligibility, then descending score, with creation time and case number for ties. Stale/ineligible/unassessed cases retain identity and remain visible without a ranking score. Alternative deadline/age sorting changes only presentation. This is a calculated discussion order, not a new formal portfolio decision.

Dependency cards traverse registered graph predecessors across initiative ownership and keep node-start requirements separate from later milestones. Availability is never a human start decision or a realized effect. DataProvenance describes actual demo sourcing, documented assessment authors, effect owners and the absence of external feeds. Detail forms are single-column and larger; their existing validation and accept rules remain unchanged.


## Readability, location and phase examples (6 September 2026)

- UI initialization/reset uses `createPresentationDemoState`; compact `initializeDemoState` remains the independent domain-test fixture.
- 18 challenges cover all seven list phases, at least two per phase. Six later examples are generated through real acceptance, start, forecast, change, measurement, verification and closure commands. One measurement awaits verification; one closed case misses its goal and quality limit. Dates are historical relative to 2026-09-06. All records remain fictional, disclosed in the footer.
- Names/descriptions read naturally. Identifiers and synthetic flags are retained. Display-text cleanup occurs before any new decision snapshot is created.
- `LocationTrail` gives workspace/case/section context. Effect tabs use the actual selected section; breadcrumbs and content cannot drift apart. Returning to the list retains its search and filter. Main navigation has a stronger selected state.
- Larger text, desktop margins around 3vw and responsive stacked layouts. Vertical reading is preferred to shrinking text.
- Control-room financial follow-up initially uses the common 2026 effect window when these new commitments are present; rates and cumulative calendar-year plans remain separate. The candidate ranking on the overview excludes already started cases.
- Continue with user review of functionality tomorrow. Preserve hard start gates, local ownership, frozen decisions, cost deduplication and the distinction between potential, forecast and verified effect.


## Current workflow revision (7 September 2026)

This section supersedes earlier counts and combined-material descriptions above.

- Nine process steps: separate Utmaning and Businesscase, qualification, assessed potential, priority, prerequisites/cost, local commitments, start decision and change/measurement. The process navigation stays present in detail views, and the sticky return bar contains the full case path. Existing list filters, history and session drafts survive navigation.
- Utmaning and Businesscase have separate save commands/payloads and document identities. Initiative creation requires a registered challenge and the five completed businesscase core fields. Placeholder scaffolds never satisfy required document fields or commitment acceptance.
- DocumentPanel is the shared template/download/upload/archive surface. Portable HTML forms export versioned JSON drafts. Import validates document kind, version, case and allowed fields; no acceptance, verification or decision commands can be imported. Other files are opaque attachments, not parsed knowledge. IndexedDB persists document copies and attachments in this browser only (10 MB/file, 30/document); domain changes remain session-only. This is not a shared records system.
- Commitment and measurement templates match their online fields, with separate human acceptance and verification. Baseline/target cannot be changed through a measurement file. Forecast, business-change and measurement forms now have independent drafts.
- Start-ready queues derive from the same startBlockers used by the reducer. Two valid examples await human start. Reviewed priority, start readiness and an actual start remain distinct.
- Missing responsibility/dates open a FollowUpEditor in place. Existing completion requirements are updated at their source; other step coordination uses challenge.stepFollowUps. These coordination assignments never replace an effect owner, a measurement plan or a frozen decision. Direct editing is available in the list, flow, current step and control-room action cards.
- Nine municipal areas have consistent fictional recipient businesses and local owners: common service/administration, health care, school, care, community planning, leisure/culture, social support, environment and IT. Effect filtering is recipient-scoped; whole initiative costs are explicitly not allocated across areas. Areas must not be added together as if each owned a shared initiative's full cost.
- CopilotHelp is explicitly prepared local guidance, NOT connected Microsoft Copilot or an AI model. It explains concepts and proposes editable scaffolds only. Applying a suggestion is explicit and preserves existing draft text. Enter only activates a focused native button; there is no global accept shortcut. No information is transmitted to an AI service.

### Real organizational Copilot: integration boundary

The proposed production path is a Copilot Studio agent embedded with the Microsoft 365 Agents SDK, Entra ID user authentication and verified tenant access. Existing organizational Copilot access does not establish this application's authorization or data handling. Tenant configuration, app registration, agent entitlement/cost and hosting must be verified before enabling the connection. Secrets cannot be placed in this static site. Context should include only the authorized case, section, relevant approved method/document versions and minimum required draft fields; documents remain untrusted evidence. Ground explanations in the agreed method with source/version references. Suggestions must go through a constrained draft patch API and existing domain validation, never acceptance/start/verification commands. Backend audit, authorization, source permissions, prompt-injection controls and evaluation cases are production work.

Primary Microsoft documentation checked:
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-integrate-web-or-native-app-m365-agents-sdk
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-sso

The next review should assess whether a nontechnical colleague can identify the current step, open a missing assignment directly, complete a separate document, understand why a high-priority initiative waits, and trace a verified outcome back to its local owner and locked baseline. Do not expand mandatory data fields merely to make the demo look more complete.
