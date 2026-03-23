interface Lead {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  business: string;
  locations: Location[];
  staff: unknown[];
  industry: Industry;
  businessType: BusinessType;
  igHandle: string;
  igFollowerCount: number;
  email: string;
  website: string;
  pipelineStage: PipelineStage;
  source: LeadSource;
  discoveredVia: DiscoveredVia;
  discoveredViaOther?: string;
  isBlackOwned: boolean;
  isLatinoOwned: boolean;
  isWomanOwned: boolean;
  isImmigrantOwned: boolean;
  touchpoints: Touchpoint[];
  notes: Note[];
  priority: Priority;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
  assignedToId?: string | null;
}

interface Location {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface Industry {
  id: string;
  name: string;
}

export interface BusinessType {
  id: string;
  name: string;
}

interface Touchpoint {
  id: string;
  date: Date;
  type: TouchpointType;
  contactedBy: User;
  receivedResponse: boolean;
  summary: string;
}

interface User {
  id: string;
}

interface Note {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  text: string;
  author: User;
}

export enum PipelineStage {
  New = "NEW",
  Contacted = "CONTACTED",
  Engaged = "ENGAGED",
  MeetingScheduled = "MEETING_SCHEDULED",
  ProposalSent = "PROPOSAL_SENT",
  Converted = "CONVERTED",
  Dormant = "DORMANT",
  NotAFit = "NOT_A_FIT",
  Lost = "LOST",
}

export enum LeadSource {
  Outreach = "OUTREACH",
  Referral = "REFERRAL",
  Form = "FORM",
}

export enum DiscoveredVia {
  Outreach = "OUTREACH",
  Referral = "REFERRAL",
  Instagram = "INSTAGRAM",
  Facebook = "FACEBOOK",
  TikTok = "TIKTOK",
  YouTube = "YOUTUBE",
  Google = "GOOGLE",
  Other = "OTHER",
}

enum TouchpointType {
  Email = "EMAIL",
  Instagram_DM = "INSTAGRAM_DM",
  Call = "CALL",
  Text = "Text",
  In_Person = "IN_PERSON",
}

export enum Priority {
  High = "ONE",
  Med = "TWO",
  Low = "THREE",
}
