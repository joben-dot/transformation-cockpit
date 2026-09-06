import type { DemoState } from "../application/demoState";

export type ValidationErrorCode =
  | "DUPLICATE_ID"
  | "KEY_ID_MISMATCH"
  | "MISSING_REFERENCE"
  | "ORGANIZATION_MISMATCH"
  | "INCONSISTENT_RELATION"
  | "INVALID_VIEW_CONTEXT"
  | "FORBIDDEN_DEMO_NAME";
export interface DemoValidationError {
  code: ValidationErrorCode;
  path: string;
  description: string;
  entityId?: string;
}

const forbiddenDemoNames = [
  "Sävsjö",
  "HIT",
  "Höglandsförbundet",
  "PVV",
  "precisionsvälfärd",
];

export function validateDemoState(state: DemoState): DemoValidationError[] {
  const errors: DemoValidationError[] = [];
  const { entities } = state;
  const collections = Object.entries(entities) as [
    string,
    Record<string, { id: string }>,
  ][];
  const seenIds = new Map<string, string>();

  for (const [collectionName, records] of collections) {
    for (const [key, entity] of Object.entries(records)) {
      if (key !== entity.id) {
        errors.push({
          code: "KEY_ID_MISMATCH",
          path: `entities.${collectionName}.${key}`,
          entityId: entity.id,
          description: "Record-nyckeln matchar inte objektets id.",
        });
      }
      const previousPath = seenIds.get(entity.id);
      if (previousPath) {
        errors.push({
          code: "DUPLICATE_ID",
          path: `entities.${collectionName}.${key}`,
          entityId: entity.id,
          description: `ID används redan i ${previousPath}.`,
        });
      } else {
        seenIds.set(entity.id, `entities.${collectionName}.${key}`);
      }
    }
  }

  const requireReference = (
    exists: boolean,
    path: string,
    entityId: string,
  ) => {
    if (!exists)
      errors.push({
        code: "MISSING_REFERENCE",
        path,
        entityId,
        description: "Referensen pekar inte på ett befintligt objekt.",
      });
  };

  Object.values(entities.organizationalUnits).forEach((unit) => {
    requireReference(
      Boolean(entities.organizations[unit.organizationId]),
      `organizationalUnits.${unit.id}.organizationId`,
      unit.organizationId,
    );
    if (unit.parentUnitId)
      requireReference(
        Boolean(entities.organizationalUnits[unit.parentUnitId]),
        `organizationalUnits.${unit.id}.parentUnitId`,
        unit.parentUnitId,
      );
  });
  Object.values(entities.businesses).forEach((business) => {
    const unit = entities.organizationalUnits[business.organizationalUnitId];
    requireReference(
      Boolean(entities.organizations[business.organizationId]),
      `businesses.${business.id}.organizationId`,
      business.organizationId,
    );
    requireReference(
      Boolean(unit),
      `businesses.${business.id}.organizationalUnitId`,
      business.organizationalUnitId,
    );
    requireReference(
      Boolean(entities.businessAreas[business.businessAreaId]),
      `businesses.${business.id}.businessAreaId`,
      business.businessAreaId,
    );
    if (unit && unit.organizationId !== business.organizationId)
      errors.push({
        code: "ORGANIZATION_MISMATCH",
        path: `businesses.${business.id}`,
        entityId: business.id,
        description: "Verksamheten och enheten tillhör olika organisationer.",
      });
  });
  Object.values(entities.positions).forEach((position) => {
    requireReference(
      Boolean(entities.organizations[position.organizationId]),
      `positions.${position.id}.organizationId`,
      position.organizationId,
    );
    if (position.organizationalUnitId)
      requireReference(
        Boolean(entities.organizationalUnits[position.organizationalUnitId]),
        `positions.${position.id}.organizationalUnitId`,
        position.organizationalUnitId,
      );
  });
  Object.values(entities.roleAssignments).forEach((assignment) => {
    requireReference(
      Boolean(entities.people[assignment.personId]),
      `roleAssignments.${assignment.id}.personId`,
      assignment.personId,
    );
    requireReference(
      Boolean(entities.roleDefinitions[assignment.roleDefinitionId]),
      `roleAssignments.${assignment.id}.roleDefinitionId`,
      assignment.roleDefinitionId,
    );
    requireReference(
      Boolean(entities.organizations[assignment.organizationId]),
      `roleAssignments.${assignment.id}.organizationId`,
      assignment.organizationId,
    );
    if (assignment.positionId)
      requireReference(
        Boolean(entities.positions[assignment.positionId]),
        `roleAssignments.${assignment.id}.positionId`,
        assignment.positionId,
      );
    if (assignment.organizationalUnitId)
      requireReference(
        Boolean(entities.organizationalUnits[assignment.organizationalUnitId]),
        `roleAssignments.${assignment.id}.organizationalUnitId`,
        assignment.organizationalUnitId,
      );
    if (assignment.businessId)
      requireReference(
        Boolean(entities.businesses[assignment.businessId]),
        `roleAssignments.${assignment.id}.businessId`,
        assignment.businessId,
      );
  });
  Object.values(entities.mandates).forEach((mandate) =>
    requireReference(
      Boolean(entities.roleAssignments[mandate.roleAssignmentId]),
      `mandates.${mandate.id}.roleAssignmentId`,
      mandate.roleAssignmentId,
    ),
  );
  Object.values(entities.challenges).forEach((challenge) => {
    requireReference(
      Boolean(entities.roleAssignments[challenge.initiatorRoleAssignmentId]),
      `challenges.${challenge.id}.initiatorRoleAssignmentId`,
      challenge.initiatorRoleAssignmentId,
    );
    challenge.relatedInitiativeIds.forEach((initiativeId) => {
      const initiative = entities.initiatives[initiativeId];
      requireReference(
        Boolean(initiative),
        `challenges.${challenge.id}.relatedInitiativeIds`,
        initiativeId,
      );
      if (initiative && initiative.challengeId !== challenge.id)
        errors.push({
          code: "INCONSISTENT_RELATION",
          path: `challenges.${challenge.id}.relatedInitiativeIds`,
          entityId: initiativeId,
          description: "Initiativets challengeId pekar på ett annat ärende.",
        });
    });
  });
  Object.values(entities.initiatives).forEach((initiative) => {
    const challenge = entities.challenges[initiative.challengeId];
    requireReference(
      Boolean(challenge),
      `initiatives.${initiative.id}.challengeId`,
      initiative.challengeId,
    );
    if (challenge && !challenge.relatedInitiativeIds.includes(initiative.id))
      errors.push({
        code: "INCONSISTENT_RELATION",
        path: `initiatives.${initiative.id}.challengeId`,
        entityId: initiative.id,
        description: "Utmaningens relatedInitiativeIds saknar initiativet.",
      });
  });
  Object.values(entities.participations).forEach((participation) => {
    requireReference(
      Boolean(entities.initiatives[participation.initiativeId]),
      `participations.${participation.id}.initiativeId`,
      participation.initiativeId,
    );
    requireReference(
      Boolean(entities.organizations[participation.organizationId]),
      `participations.${participation.id}.organizationId`,
      participation.organizationId,
    );
    if (participation.businessId) {
      const business = entities.businesses[participation.businessId];
      requireReference(
        Boolean(business),
        `participations.${participation.id}.businessId`,
        participation.businessId,
      );
      if (business && business.organizationId !== participation.organizationId)
        errors.push({
          code: "ORGANIZATION_MISMATCH",
          path: `participations.${participation.id}`,
          entityId: participation.id,
          description: "Deltagandets verksamhet tillhör en annan organisation.",
        });
    }
  });
  Object.values(entities.resourceAllocations).forEach((allocation) => {
    requireReference(
      Boolean(entities.capabilities[allocation.capabilityId]),
      `resourceAllocations.${allocation.id}.capabilityId`,
      allocation.capabilityId,
    );
    requireReference(
      Boolean(entities.initiatives[allocation.initiativeId]),
      `resourceAllocations.${allocation.id}.initiativeId`,
      allocation.initiativeId,
    );
    if (allocation.roleAssignmentId)
      requireReference(
        Boolean(entities.roleAssignments[allocation.roleAssignmentId]),
        `resourceAllocations.${allocation.id}.roleAssignmentId`,
        allocation.roleAssignmentId,
      );
    if (allocation.organizationalUnitId)
      requireReference(
        Boolean(entities.organizationalUnits[allocation.organizationalUnitId]),
        `resourceAllocations.${allocation.id}.organizationalUnitId`,
        allocation.organizationalUnitId,
      );
  });
  Object.values(entities.qualificationAssessments).forEach((assessment) => {
    requireReference(
      Boolean(entities.initiatives[assessment.initiativeId]),
      `qualificationAssessments.${assessment.id}.initiativeId`,
      assessment.initiativeId,
    );
    requireReference(
      Boolean(
        entities.qualificationConfigurations[
          assessment.assessedAgainstConfigurationVersion
        ],
      ),
      `qualificationAssessments.${assessment.id}.assessedAgainstConfigurationVersion`,
      assessment.assessedAgainstConfigurationVersion,
    );
    requireReference(
      Boolean(entities.roleAssignments[assessment.assessedByRoleAssignmentId]),
      `qualificationAssessments.${assessment.id}.assessedByRoleAssignmentId`,
      assessment.assessedByRoleAssignmentId,
    );
    if (assessment.verifiedByRoleAssignmentId)
      requireReference(
        Boolean(
          entities.roleAssignments[assessment.verifiedByRoleAssignmentId],
        ),
        `qualificationAssessments.${assessment.id}.verifiedByRoleAssignmentId`,
        assessment.verifiedByRoleAssignmentId,
      );
  });
  Object.values(entities.completionRequirements).forEach((requirement) => {
    requireReference(
      Boolean(entities.initiatives[requirement.initiativeId]),
      `completionRequirements.${requirement.id}.initiativeId`,
      requirement.initiativeId,
    );
    if (requirement.qualificationAssessmentId)
      requireReference(
        Boolean(
          entities.qualificationAssessments[
            requirement.qualificationAssessmentId
          ],
        ),
        `completionRequirements.${requirement.id}.qualificationAssessmentId`,
        requirement.qualificationAssessmentId,
      );
    if (
      requirement.qualificationAssessmentId &&
      entities.qualificationAssessments[requirement.qualificationAssessmentId]
        ?.initiativeId !== requirement.initiativeId
    )
      errors.push({
        code: "INCONSISTENT_RELATION",
        path: `completionRequirements.${requirement.id}.qualificationAssessmentId`,
        entityId: requirement.id,
        description:
          "Kompletteringskravet och kriteriebedömningen tillhör olika initiativ.",
      });
    if (requirement.responsibleRoleAssignmentId)
      requireReference(
        Boolean(
          entities.roleAssignments[requirement.responsibleRoleAssignmentId],
        ),
        `completionRequirements.${requirement.id}.responsibleRoleAssignmentId`,
        requirement.responsibleRoleAssignmentId,
      );
    if (requirement.verifierRoleAssignmentId)
      requireReference(
        Boolean(entities.roleAssignments[requirement.verifierRoleAssignmentId]),
        `completionRequirements.${requirement.id}.verifierRoleAssignmentId`,
        requirement.verifierRoleAssignmentId,
      );
  });
  Object.values(entities.effectPotentials).forEach((potential) => {
    requireReference(
      Boolean(entities.initiatives[potential.initiativeId]),
      `effectPotentials.${potential.id}.initiativeId`,
      potential.initiativeId,
    );
    if (potential.recipientBusinessId)
      requireReference(
        Boolean(entities.businesses[potential.recipientBusinessId]),
        `effectPotentials.${potential.id}.recipientBusinessId`,
        potential.recipientBusinessId,
      );
    potential.assessedByRoleAssignmentIds.forEach((roleId) =>
      requireReference(
        Boolean(entities.roleAssignments[roleId]),
        `effectPotentials.${potential.id}.assessedByRoleAssignmentIds`,
        roleId,
      ),
    );
  });
  Object.values(entities.steeringProfileVersions).forEach((profile) => {
    if (profile.decidedByDecisionFunctionId)
      requireReference(
        Boolean(
          entities.decisionFunctions[profile.decidedByDecisionFunctionId],
        ),
        `steeringProfileVersions.${profile.id}.decidedByDecisionFunctionId`,
        profile.decidedByDecisionFunctionId,
      );
  });
  Object.values(entities.priorityAssessments).forEach((assessment) => {
    requireReference(
      Boolean(entities.initiatives[assessment.initiativeId]),
      `priorityAssessments.${assessment.id}.initiativeId`,
      assessment.initiativeId,
    );
    requireReference(
      Boolean(
        entities.steeringProfileVersions[assessment.steeringProfileVersionId],
      ),
      `priorityAssessments.${assessment.id}.steeringProfileVersionId`,
      assessment.steeringProfileVersionId,
    );
    if (assessment.reviewedByRoleAssignmentId)
      requireReference(
        Boolean(
          entities.roleAssignments[assessment.reviewedByRoleAssignmentId],
        ),
        `priorityAssessments.${assessment.id}.reviewedByRoleAssignmentId`,
        assessment.reviewedByRoleAssignmentId,
      );
    if (assessment.reviewedByPersonId)
      requireReference(
        Boolean(entities.people[assessment.reviewedByPersonId]),
        `priorityAssessments.${assessment.id}.reviewedByPersonId`,
        assessment.reviewedByPersonId,
      );
    if (assessment.reviewMandateId)
      requireReference(
        Boolean(entities.mandates[assessment.reviewMandateId]),
        `priorityAssessments.${assessment.id}.reviewMandateId`,
        assessment.reviewMandateId,
      );
  });
  if (
    state.viewContext.activeChallengeId &&
    !entities.challenges[state.viewContext.activeChallengeId]
  )
    errors.push({
      code: "INVALID_VIEW_CONTEXT",
      path: "viewContext.activeChallengeId",
      entityId: state.viewContext.activeChallengeId,
      description: "Aktiv utmaning finns inte.",
    });
  if (
    state.viewContext.activeInitiativeId &&
    !entities.initiatives[state.viewContext.activeInitiativeId]
  )
    errors.push({
      code: "INVALID_VIEW_CONTEXT",
      path: "viewContext.activeInitiativeId",
      entityId: state.viewContext.activeInitiativeId,
      description: "Aktivt initiativ finns inte.",
    });
  if (
    state.viewContext.selectedPerspective.kind === "ORGANIZATION" &&
    !entities.organizations[
      state.viewContext.selectedPerspective.organizationId
    ]
  )
    errors.push({
      code: "INVALID_VIEW_CONTEXT",
      path: "viewContext.selectedPerspective",
      entityId: state.viewContext.selectedPerspective.organizationId,
      description: "Perspektivets organisation finns inte.",
    });

  const serialized = JSON.stringify(entities);
  forbiddenDemoNames.forEach((name) => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactName = new RegExp(
      `(^|[^A-Za-zÅÄÖåäö])${escapedName}([^A-Za-zÅÄÖåäö]|$)`,
      "i",
    );
    if (exactName.test(serialized))
      errors.push({
        code: "FORBIDDEN_DEMO_NAME",
        path: "entities",
        description: `Förbjudet verkligt namn förekommer: ${name}.`,
      });
  });
  return errors;
}
