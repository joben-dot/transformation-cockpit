import {
  createId,
  type Business,
  type BusinessArea,
  type LegalOrganization,
  type OrganizationalUnit,
} from "../domain";

export const organizationIds = {
  north: createId("Organization", "org-001"),
  south: createId("Organization", "org-002"),
};
export const unitIds = {
  northService: createId("OrganizationalUnit", "unit-001"),
  southDevelopment: createId("OrganizationalUnit", "unit-002"),
};
export const businessAreaId = createId("BusinessArea", "area-001");
export const businessIds = {
  intake: createId("Business", "business-001"),
  response: createId("Business", "business-002"),
};

export const organizations: LegalOrganization[] = [
  {
    id: organizationIds.north,
    name: "Exempelorganisation Norr",
    isSynthetic: true,
  },
  {
    id: organizationIds.south,
    name: "Exempelorganisation Syd",
    isSynthetic: true,
  },
];
export const organizationalUnits: OrganizationalUnit[] = [
  {
    id: unitIds.northService,
    organizationId: organizationIds.north,
    name: "Serviceenhet Alfa",
  },
  {
    id: unitIds.southDevelopment,
    organizationId: organizationIds.south,
    name: "Utvecklingsenhet Beta",
  },
];
export const businessAreas: BusinessArea[] = [
  { id: businessAreaId, name: "Syntetisk service" },
];
export const businesses: Business[] = [
  {
    id: businessIds.intake,
    organizationId: organizationIds.north,
    organizationalUnitId: unitIds.northService,
    businessAreaId,
    name: "Verksamhet Inlopp",
  },
  {
    id: businessIds.response,
    organizationId: organizationIds.south,
    organizationalUnitId: unitIds.southDevelopment,
    businessAreaId,
    name: "Verksamhet Respons",
  },
];
