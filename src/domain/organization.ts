import type {
  BusinessAreaId,
  BusinessId,
  OrganizationId,
  OrganizationalUnitId,
} from "./ids";

export interface LegalOrganization {
  id: OrganizationId;
  name: string;
  isSynthetic: boolean;
}
export interface OrganizationalUnit {
  id: OrganizationalUnitId;
  organizationId: OrganizationId;
  parentUnitId?: OrganizationalUnitId;
  name: string;
}
export interface BusinessArea {
  id: BusinessAreaId;
  name: string;
}
export interface Business {
  id: BusinessId;
  organizationId: OrganizationId;
  organizationalUnitId: OrganizationalUnitId;
  businessAreaId: BusinessAreaId;
  name: string;
}
