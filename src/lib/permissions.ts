// Role hierarchy for BloomyLMS
export type UserRole = 'super_admin' | 'admin' | 'instructor' | 'student'

export function isSuperAdmin(role?: string) {
  return role === 'super_admin'
}

export function isAdmin(role?: string) {
  return role === 'super_admin' || role === 'admin'
}

export function isInstructor(role?: string) {
  return role === 'super_admin' || role === 'admin' || role === 'instructor'
}

export function canManageUsers(role?: string) {
  return isAdmin(role)
}

export function canPromoteRoles(role?: string) {
  return isSuperAdmin(role)
}

export function canManageCourses(role?: string) {
  return isAdmin(role)
}

export function canEnrollStudents(role?: string) {
  return isAdmin(role)
}
