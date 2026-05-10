import { SEQUENCE_POSITIONS_VISIT, SEQUENCE_POSITIONS_OUTREACH } from "../constants/leads";
import { IN_PERSON_TYPES } from "../constants/touchpoints";

/**
 * Returns the appropriate sequence position options based on the touchpoint type.
 * In-person types (IN_PERSON, MEETING) use visit positions; all others use outreach positions.
 */
export const getSequencePositions = (type: string) =>
  IN_PERSON_TYPES.includes(type)
    ? SEQUENCE_POSITIONS_VISIT
    : SEQUENCE_POSITIONS_OUTREACH;
