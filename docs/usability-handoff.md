# Usability working version

This branch changes presentation and navigation around the existing normalized domain. It is a draft pending browser review; the current published demo has not been updated with these changes.

## User outcome

A user should be able to explain the initiative's current position, missing evidence, next action, responsible role, outstanding decisions, planned dependencies, capacity and effect follow-up. Opening a later step must never approve a prerequisite or make a start decision.

## Implemented

- Ten visible steps shared by method help, case navigation and the case summary. Effect potential is a businesscase subview; implementation, measurement and learning are separate views.
- A next-action summary and a disclosure of remaining work. Existing completion requirements, roles and due dates stay actionable.
- Draft retention extended to potential, priority scores, qualification answers, completion responses, decision rationale, measurement evidence and learning text. Explicit acceptance/verification controls are not remembered as consent.
- The global method guide collapses while an initiative is being edited. Compact process navigation replaces duplicate effect tabs in that context.
- Control Room adds a planned timeline, external prerequisites with color and text, shared prerequisite grouping, and a capacity/cost view.
- A separate local scenario scales individual effect assessments and shifts possible effect dates. Costs can be varied separately; source data, commitments and decisions are not mutated.
- Priority criteria and weights are available beside assessments and comparison. Governance configuration remains accessible from the foundation section of help.

## Preserved constraints

The command reducer still owns permissions and gates. Qualification, active local effect acceptance and a human start decision remain separate. Decision snapshots, measured values, quality failures, missed effects and history remain intact. Area filters never create participants. Shared cost entries are counted once within an analysis. Annual rates, period totals, time and quality are not freely added together.

## Validation

The full Vitest suite passed: 232 tests in 41 files. It includes a React-renderer journey from a new challenge through qualification, priority review, local acceptance, start, confirmed change, measurement, independent verification, missed target and closure. Additional checks cover external dependencies, shared prerequisites, scenario nonmutation, missing costs, invalid plan windows, ten-step projection and retained unsaved input. TypeScript and the production build passed.

These are automated component/domain checks, not browser usability evidence. React renderer can access controls inside closed disclosures and hidden sections. No claim of visual, keyboard, touch or responsive verification is made.

The managed preview failed to start twice with `vite: not found`. Dependency materialization and Vite host configuration did not resolve the supervised runner failure. Stop retrying in that session. Use the supported Sites preview recovery workflow in a fresh environment, then the approved browser-control tool. No alternate browser transport was used.

## Required browser review before publishing this larger change

1. Desktop and narrow viewport: method guide, compact toolbar, focus visibility, ten-step navigation, disclosure states and validation messages. Ensure normal work does not require scrolling past repeated headings.
2. Create an initiative, visit later steps with missing data, return to drafts, then complete the human role sequence. Check that the suggested next action agrees with the real form and never grants authority.
3. Review external and indirect dependencies from an area filter, open the owning initiative, and return with the same selection and time window. Compare the timeline with the text dependency list.
4. Review several initiatives sharing one prerequisite. Verify that grouping does not imply automatic start eligibility or additive effect claims.
5. Exercise capacity conflicts, unknown capacity and empty cost data. Inspect scenario reset and source data after simulation.
6. Follow an initiative whose local change is confirmed but effect dates remain ahead. Verify separate measurement/verification and record a missed target and a quality failure.
7. Check existing document import/export, decision history, change decisions, new recipients/scaling and governance configuration remain reachable.

## Modeling limits to keep explicit

- This is a session-based demo, not authenticated multiuser production software. Existing role selectors represent demo roles; real mandates and financing decisions must not be invented.
- The timeline shows registered planned execution-node periods and availability. Availability is not proof of actual start or completion. Local business-change confirmation is separately labeled and must not be described as completion of every technical delivery.
- The displayed date guides active participation, due dates and effect views; it is not a full historical reconstruction of every entity at that date.
- Capacity rows are selected by overlap with the requested window, but the conflict calculation covers the whole recorded demand period, including competing demands outside the area.
- Cost totals use existing estimates and full-calendar-year handling. Incomplete partial-year calculations and missing records remain visible.
- The scenario is proportional sensitivity analysis of registered effect components and assumptions. It is not a causal forecast, automatic capacity rescheduling or portfolio optimizer.
- Session drafts survive view changes, not necessarily a page reload. Confirm every remaining editor before claiming universal draft retention.
- Compact styling and click reduction have not yet been validated with an actual user or measured against the previous interface.

Use this branch as the starting point. Do not restart the product or replace the domain model to improve its appearance.
