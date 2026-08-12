import type { EnrollmentStatus } from './types'

const ACTIVE: EnrollmentStatus[] = [
  'researching',
  'applied',
  'opened',
  'funding',
  'meeting_requirements',
  'waiting_bonus',
  'bonus_posted',
  'clawback',
  'close_eligible',
  'disputed',
]

const PIPELINE_COLUMNS: EnrollmentStatus[] = [
  'researching',
  'applied',
  'opened',
  'funding',
  'meeting_requirements',
  'waiting_bonus',
  'bonus_posted',
  'clawback',
  'close_eligible',
]

export const statusLabels: Record<EnrollmentStatus, string> = {
  researching: 'Researching',
  applied: 'Applied',
  opened: 'Opened',
  funding: 'Funding',
  meeting_requirements: 'Meeting reqs',
  waiting_bonus: 'Waiting on bonus',
  bonus_posted: 'Bonus posted',
  clawback: 'Clawback hold',
  close_eligible: 'Ready to close',
  closed: 'Closed',
  cooling_down: 'Cooling down',
  re_eligible: 'Re-eligible',
  denied: 'Denied',
  abandoned: 'Abandoned',
  disputed: 'Disputed',
}

export function isActiveStatus(status: EnrollmentStatus) {
  return ACTIVE.includes(status)
}

export function pipelineColumns() {
  return PIPELINE_COLUMNS
}

/** Soft forward graph — UI may still set any status manually. */
export const suggestedNext: Partial<Record<EnrollmentStatus, EnrollmentStatus>> = {
  researching: 'applied',
  applied: 'opened',
  opened: 'funding',
  funding: 'meeting_requirements',
  meeting_requirements: 'waiting_bonus',
  waiting_bonus: 'bonus_posted',
  bonus_posted: 'clawback',
  clawback: 'close_eligible',
  close_eligible: 'closed',
  closed: 'cooling_down',
  cooling_down: 're_eligible',
}
